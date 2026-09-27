#include <Arduino.h>
#include <WiFi.h>
#include <FirebaseESP32.h>
#include "DHT.h"
#include "driver/i2s.h"

// ==========================================
// Wi-Fi Credentials
// ==========================================
const char* ssid = "Dialog 4G 342";
const char* password = "260Ef462";

// ==========================================
// Firebase Configuration (Roombox Path)
// ==========================================
#define FIREBASE_HOST "elderly-care-7c713-default-rtdb.firebaseio.com"
#define FIREBASE_AUTH ""

// ==========================================
// 1. SENSOR & PIN CONFIGURATIONS
// ==========================================

// DHT11 / DHT22
#define DHTPIN 4
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

// PIR Motion Sensor
const int pirPin = 18;

// ==========================================
// 2. INMP441 I2S MICROPHONE CONFIGURATION
// ==========================================

// INMP441 wiring:
// VDD -> 3.3V
// GND -> GND
// L/R -> GND
// WS  -> GPIO 15
// SCK -> GPIO 14
// SD  -> GPIO 32

#define I2S_PORT I2S_NUM_0

#define I2S_WS   15
#define I2S_SCK  14
#define I2S_SD   32

#define SAMPLE_RATE 16000
#define I2S_BUFFER_SIZE 1024

// ==========================================
// Firebase Objects
// ==========================================
FirebaseData firebaseData;
FirebaseAuth auth;
FirebaseConfig config;

// ==========================================
// Function: Initialize INMP441
// ==========================================
void setupI2SMicrophone() {

  i2s_config_t i2s_config = {
    .mode = (i2s_mode_t)(
      I2S_MODE_MASTER |
      I2S_MODE_RX
    ),

    .sample_rate = SAMPLE_RATE,

    .bits_per_sample = I2S_BITS_PER_SAMPLE_32BIT,

    .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT,

    .communication_format = I2S_COMM_FORMAT_I2S,

    .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,

    .dma_buf_count = 8,

    .dma_buf_len = 256,

    .use_apll = false,

    .tx_desc_auto_clear = false,

    .fixed_mclk = 0
  };

  i2s_pin_config_t pin_config = {
    .bck_io_num = I2S_SCK,
    .ws_io_num = I2S_WS,
    .data_out_num = I2S_PIN_NO_CHANGE,
    .data_in_num = I2S_SD
  };

  i2s_driver_install(
    I2S_PORT,
    &i2s_config,
    0,
    NULL
  );

  i2s_set_pin(
    I2S_PORT,
    &pin_config
  );

  i2s_zero_dma_buffer(I2S_PORT);

  Serial.println("✅ INMP441 microphone initialized!");
}

// ==========================================
// Function: Read Real Microphone Sound Level
// ==========================================
int readMicrophoneLevel() {

  int32_t samples[I2S_BUFFER_SIZE];

  size_t bytesRead = 0;

  esp_err_t result = i2s_read(
    I2S_PORT,
    (void*)samples,
    sizeof(samples),
    &bytesRead,
    portMAX_DELAY
  );

  if (result != ESP_OK || bytesRead == 0) {
    return 15;
  }

  int sampleCount = bytesRead / sizeof(int32_t);

  double sumSquares = 0;

  for (int i = 0; i < sampleCount; i++) {

    // INMP441 produces 24-bit audio data inside a 32-bit container.
    int32_t sample = samples[i] >> 8;

    sumSquares += (double)sample * (double)sample;
  }

  double rms = sqrt(
    sumSquares / sampleCount
  );

  // ==========================================
  // Convert microphone RMS into a practical
  // sound-level value for the Roombox system.
  // ==========================================

  // These values are intentionally kept within
  // the same general range as the previous
  // simulated SoundLevel values.
  //
  // Quiet environment  -> approximately 15-85
  // Louder speech/noise -> approximately 120-350

  double normalizedLevel = rms / 1000.0;

  int soundLevel = (int)(normalizedLevel * 25.0);

  // Prevent very small background noise
  // from becoming zero.
  if (soundLevel < 15) {
    soundLevel = 15;
  }

  // Limit the normal range.
  if (soundLevel > 350) {
    soundLevel = 350;
  }

  return soundLevel;
}

// ==========================================
// SETUP
// ==========================================
void setup() {

  Serial.begin(115200);

  delay(1000);

  Serial.println("\n\n===================================");
  Serial.println("Roombox Device - Integration Mode");
  Serial.println("===================================");

  // ==========================================
  // Initialize DHT Sensor
  // ==========================================
  dht.begin();

  // ==========================================
  // Initialize PIR Sensor
  // ==========================================
  pinMode(pirPin, INPUT);

  // ==========================================
  // Initialize INMP441 Microphone
  // ==========================================
  setupI2SMicrophone();

  // ==========================================
  // Connect to Wi-Fi
  // ==========================================
  WiFi.begin(ssid, password);

  Serial.print("Connecting to WiFi");

  while (WiFi.status() != WL_CONNECTED) {

    delay(500);

    Serial.print(".");
  }

  Serial.println("\n✅ WiFi Connected!");

  Serial.print("IP Address: ");

  Serial.println(WiFi.localIP());

  // ==========================================
  // Firebase Credentials Setup
  // ==========================================
  config.host = FIREBASE_HOST;

  config.database_url = FIREBASE_HOST;

  if (String(FIREBASE_AUTH) != "") {

    config.signer.tokens.legacy_token =
      FIREBASE_AUTH;

  } else {

    config.signer.test_mode = true;
  }

  // ==========================================
  // Begin Firebase Connection
  // ==========================================
  Firebase.begin(
    &config,
    &auth
  );

  Firebase.reconnectWiFi(true);

  Serial.println("✅ Firebase initialized!");
}

// ==========================================
// MAIN LOOP
// ==========================================
void loop() {

  // ==========================================
  // 1. Read DHT11
  // ==========================================
  float humidity = dht.readHumidity();

  float temperature = dht.readTemperature();

  if (isnan(humidity) || isnan(temperature)) {

    Serial.println(
      "❌ DHT sensor reading failed! Retrying..."
    );

    delay(1000);

    return;
  }

  // ==========================================
  // 2. Read PIR Motion Sensor
  // ==========================================
  int motionDetected =
    digitalRead(pirPin);

  // ==========================================
  // 3. Read REAL INMP441 Microphone
  // ==========================================
  int soundLevel =
    readMicrophoneLevel();

  // ==========================================
  // Print Sensor Data to Serial Monitor
  // ==========================================
  Serial.print("Temp: ");
  Serial.print(temperature);
  Serial.print("°C  ");

  Serial.print("Humidity: ");
  Serial.print(humidity);
  Serial.print("%  ");

  Serial.print("Motion: ");
  Serial.print(motionDetected);
  Serial.print("  ");

  Serial.print("Live Sound Level: ");
  Serial.println(soundLevel);

  // ==========================================
  // 4. Create Firebase JSON Object
  // ==========================================
  FirebaseJson json;

  json.set(
    "Temperature",
    temperature
  );

  json.set(
    "Humidity",
    humidity
  );

  json.set(
    "Motion",
    motionDetected
  );

  json.set(
    "SoundLevel",
    soundLevel
  );

  // ==========================================
  // 5. Send Data to Firebase
  // ==========================================
  if (
    Firebase.setJSON(
      firebaseData,
      "/Roombox",
      json
    )
  ) {

    Serial.println(
      "✅ Roombox data synced to Firebase successfully!"
    );

  } else {

    Serial.print(
      "❌ Firebase Error: "
    );

    Serial.println(
      firebaseData.errorReason()
    );
  }

  // ==========================================
  // Update every 1 second
  // ==========================================
  delay(1000);
}