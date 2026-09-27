#include <Arduino.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>

// ==========================================
// Firebase Configuration
// ==========================================
#define ENABLE_USER_AUTH
#define ENABLE_DATABASE
#include <FirebaseClient.h>

// ==========================================
// I2C Sensor Libraries
// ==========================================
#include <Wire.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>

// ==========================================
// MAX30102 Library
// ==========================================
#include "MAX30105.h"
#include "spo2_algorithm.h"

// ==========================================
// WiFi Configuration
// ==========================================
#define WIFI_SSID "Dialog 4G 342"
#define WIFI_PASSWORD "260Ef462"

// ==========================================
// Firebase Configuration
// ==========================================
#define API_KEY "AIzaSyBsuR6OCTL_fa5TLYegh9xYxO2JOiyKkQQ"
#define DATABASE_URL "https://elderly-care-7c713-default-rtdb.firebaseio.com/"

// ==========================================
// ESP32-C3 SUPER MINI PIN DEFINITIONS
// ==========================================

// Shared I2C bus
#define SDA_PIN 8
#define SCL_PIN 9

// SOS push button
#define BUTTON_PIN 3

// ==========================================
// MPU6050
// ==========================================
Adafruit_MPU6050 mpu;

// ==========================================
// MAX30102
// ==========================================
MAX30105 particleSensor;

// ==========================================
// Firebase Objects
// ==========================================
WiFiClientSecure ssl;

using AsyncClient = AsyncClientClass;

AsyncClient aClient(ssl);

FirebaseApp app;

RealtimeDatabase Database;

NoAuth no_auth;

// ==========================================
// MAX30102 BUFFER CONFIGURATION
// ==========================================

// The official SparkFun SpO2 example uses
// 100 samples for the calculation.
#define BUFFER_LENGTH 100

uint32_t irBuffer[BUFFER_LENGTH];
uint32_t redBuffer[BUFFER_LENGTH];

// Calculated heart-rate and SpO2 values
int32_t heartRate = 0;
int32_t spo2 = 0;

// Validity flags returned by the algorithm
int8_t validHeartRate = 0;
int8_t validSpO2 = 0;

// Latest raw MAX30102 values
uint32_t latestIR = 0;
uint32_t latestRed = 0;

// Latest MAX30102 temperature
float max30102Temperature = 0.0;

// ==========================================
// Timing
// ==========================================
unsigned long lastFirebaseUpdate = 0;

const unsigned long FIREBASE_UPDATE_INTERVAL = 1000;

// ==========================================
// MAX30102 INITIALIZATION
// ==========================================
bool initializeMAX30102()
{
  Serial.println("Initializing MAX30102...");

  if (!particleSensor.begin(Wire, I2C_SPEED_FAST))
  {
    Serial.println("❌ MAX30102 was not found.");
    Serial.println("Check VCC, GND, SDA, SCL and sensor connection.");

    return false;
  }

  Serial.println("✅ MAX30102 detected.");

  // Configure sensor:
  //
  // Power level      = 60
  // Sample averaging = 4
  // LED mode         = 2 (Red + IR)
  // Sample rate      = 100 Hz
  // Pulse width      = 411 us
  // ADC range        = 4096

  particleSensor.setup(
    60,
    4,
    2,
    100,
    411,
    4096
  );

  // Red LED
  particleSensor.setPulseAmplitudeRed(0x2F);

  // IR LED
  particleSensor.setPulseAmplitudeIR(0x2F);

  // Green LED is not available on MAX30102
  particleSensor.setPulseAmplitudeGreen(0);

  Serial.println("✅ MAX30102 configured.");

  return true;
}

// ==========================================
// COLLECT INITIAL MAX30102 SAMPLES
// ==========================================
bool collectInitialMAX30102Samples()
{
  Serial.println();
  Serial.println("======================================");
  Serial.println("Collecting initial MAX30102 samples...");
  Serial.println("Please place your finger firmly on");
  Serial.println("the MAX30102 sensor.");
  Serial.println("======================================");

  for (byte i = 0; i < BUFFER_LENGTH; i++)
  {
    // Wait for a new sample
    while (particleSensor.available() == false)
    {
      particleSensor.check();
      app.loop();
    }

    redBuffer[i] = particleSensor.getRed();
    irBuffer[i] = particleSensor.getIR();

    latestRed = redBuffer[i];
    latestIR = irBuffer[i];

    particleSensor.nextSample();

    Serial.print("Sample ");
    Serial.print(i + 1);
    Serial.print("/");
    Serial.print(BUFFER_LENGTH);

    Serial.print(" | IR: ");
    Serial.print(irBuffer[i]);

    Serial.print(" | RED: ");
    Serial.println(redBuffer[i]);
  }

  // Calculate initial HR and SpO2
  maxim_heart_rate_and_oxygen_saturation(
    irBuffer,
    BUFFER_LENGTH,
    redBuffer,
    &spo2,
    &validSpO2,
    &heartRate,
    &validHeartRate
  );

  Serial.println();
  Serial.println("Initial MAX30102 calculation complete.");

  return true;
}

// ==========================================
// UPDATE MAX30102 CALCULATION
// ==========================================
void updateMAX30102()
{
  // Shift the latest 75 samples to the beginning.
  //
  // This keeps a rolling 100-sample window.

  for (byte i = 25; i < BUFFER_LENGTH; i++)
  {
    redBuffer[i - 25] = redBuffer[i];
    irBuffer[i - 25] = irBuffer[i];
  }

  // Collect 25 new samples
  for (byte i = 75; i < BUFFER_LENGTH; i++)
  {
    while (particleSensor.available() == false)
    {
      particleSensor.check();
      app.loop();
    }

    redBuffer[i] = particleSensor.getRed();
    irBuffer[i] = particleSensor.getIR();

    latestRed = redBuffer[i];
    latestIR = irBuffer[i];

    particleSensor.nextSample();
  }

  // Recalculate Heart Rate and SpO2
  maxim_heart_rate_and_oxygen_saturation(
    irBuffer,
    BUFFER_LENGTH,
    redBuffer,
    &spo2,
    &validSpO2,
    &heartRate,
    &validHeartRate
  );

  // Read MAX30102 internal temperature
  max30102Temperature = particleSensor.readTemperature();
}

// ==========================================
// SETUP
// ==========================================
void setup()
{
  Serial.begin(115200);

  delay(2000);

  Serial.println();
  Serial.println();
  Serial.println("======================================");
  Serial.println("Smart Wearable");
  Serial.println("ESP32-C3 Super Mini");
  Serial.println("Real Sensor Integration Mode");
  Serial.println("======================================");

  // ==========================================
  // 1. Initialize WiFi
  // ==========================================
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);

  WiFi.begin(
    WIFI_SSID,
    WIFI_PASSWORD
  );

  while (WiFi.status() != WL_CONNECTED)
  {
    Serial.print(".");
    delay(500);
  }

  Serial.println();
  Serial.println("✅ WiFi Connected!");

  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());

  // ==========================================
  // 2. Initialize Firebase
  // ==========================================
  ssl.setInsecure();

  Serial.println("Initializing Firebase App...");

  initializeApp(
    aClient,
    app,
    getAuth(no_auth)
  );

  app.getApp<RealtimeDatabase>(Database);

  Database.url(DATABASE_URL);

  Serial.println("✅ Firebase initialized.");

  // ==========================================
  // 3. Initialize I2C
  // ==========================================
  //
  // ESP32-C3 Super Mini:
  //
  // SDA -> GPIO 8
  // SCL -> GPIO 9
  //
  // MPU6050 and MAX30102 share the same I2C bus.

  Wire.begin(
    SDA_PIN,
    SCL_PIN
  );

  Wire.setClock(400000);

  Serial.println("✅ I2C initialized.");
  Serial.println("SDA = GPIO 8");
  Serial.println("SCL = GPIO 9");

  // ==========================================
  // 4. Initialize SOS Button
  // ==========================================
  //
  // Button:
  // Pin 1 -> GPIO 3
  // Pin 2 -> GND
  //
  // INPUT_PULLUP means:
  //
  // Not pressed = HIGH
  // Pressed     = LOW

  pinMode(
    BUTTON_PIN,
    INPUT_PULLUP
  );

  Serial.println("✅ SOS button initialized.");

  // ==========================================
  // 5. Initialize MPU6050
  // ==========================================
  Serial.println("Initializing MPU6050...");

  if (!mpu.begin(
        0x68,
        &Wire
      ))
  {
    Serial.println("❌ MPU6050 was not found.");
    Serial.println("Check SDA, SCL, VCC, GND and AD0.");
  }
  else
  {
    Serial.println("✅ MPU6050 Initialized.");

    mpu.setAccelerometerRange(
      MPU6050_RANGE_8_G
    );

    mpu.setGyroRange(
      MPU6050_RANGE_500_DEG
    );

    mpu.setFilterBandwidth(
      MPU6050_BAND_21_HZ
    );
  }

  // ==========================================
  // 6. Initialize MAX30102
  // ==========================================
  bool max30102Ready =
    initializeMAX30102();

  if (!max30102Ready)
  {
    Serial.println(
      "❌ MAX30102 initialization failed."
    );
  }
  else
  {
    // Collect the first 100 samples
    // required for the initial calculation.

    collectInitialMAX30102Samples();

    // Read initial temperature
    max30102Temperature =
      particleSensor.readTemperature();
  }

  Serial.println();
  Serial.println("======================================");
  Serial.println("System initialization complete.");
  Serial.println("======================================");
}

// ==========================================
// MAIN LOOP
// ==========================================
void loop()
{
  // Maintain Firebase connection
  // and background tasks.
  app.loop();

  // ==========================================
  // Keep collecting MAX30102 data
  // continuously.
  // ==========================================
  particleSensor.check();

  // ==========================================
  // Read and process MAX30102 data
  // when enough new samples are available.
  // ==========================================
  if (particleSensor.available())
  {
    // Get the latest raw readings
    latestRed = particleSensor.getRed();
    latestIR = particleSensor.getIR();

    particleSensor.nextSample();
  }

  // ==========================================
  // Update Firebase once every second
  // ==========================================
  if (
    app.ready() &&
    (millis() - lastFirebaseUpdate >=
     FIREBASE_UPDATE_INTERVAL)
  )
  {
    lastFirebaseUpdate = millis();

    Serial.println();
    Serial.println(
      "--- Reading Sensors & Pushing to Firebase ---"
    );

    // ==========================================
    // 1. Read SOS Button
    // ==========================================
    bool buttonPressed =
      (digitalRead(BUTTON_PIN) == LOW);

    // ==========================================
    // 2. Read MPU6050
    // ==========================================
    sensors_event_t a;
    sensors_event_t g;
    sensors_event_t temp;

    mpu.getEvent(
      &a,
      &g,
      &temp
    );

    // ==========================================
    // 3. Update MAX30102 HR and SpO2
    // ==========================================
    updateMAX30102();

    // ==========================================
    // 4. Validate HR
    // ==========================================
    int finalHeartRate;

    if (validHeartRate &&
        heartRate > 0 &&
        heartRate < 250)
    {
      finalHeartRate = heartRate;
    }
    else
    {
      finalHeartRate = 0;
    }

    // ==========================================
    // 5. Validate SpO2
    // ==========================================
    int finalSpO2;

    if (
      validSpO2 &&
      spo2 >= 70 &&
      spo2 <= 100
    )
    {
      finalSpO2 = spo2;
    }
    else
    {
      finalSpO2 = 0;
    }

    // ==========================================
    // 6. Construct JSON Payload
    // ==========================================
    String jsonPayload = "{";

    // SOS
    jsonPayload +=
      "\"button_pressed\":" +
      String(
        buttonPressed ? "true" : "false"
      ) +
      ",";

    // Real MAX30102 data
    jsonPayload +=
      "\"max30102_ir\":" +
      String(latestIR) +
      ",";

    jsonPayload +=
      "\"max30102_red\":" +
      String(latestRed) +
      ",";

    jsonPayload +=
      "\"heart_rate\":" +
      String(finalHeartRate) +
      ",";

    jsonPayload +=
      "\"heart_rate_valid\":" +
      String(
        validHeartRate ? "true" : "false"
      ) +
      ",";

    jsonPayload +=
      "\"spo2\":" +
      String(finalSpO2) +
      ",";

    jsonPayload +=
      "\"spo2_valid\":" +
      String(
        validSpO2 ? "true" : "false"
      ) +
      ",";

    jsonPayload +=
      "\"max30102_temp\":" +
      String(
        max30102Temperature,
        2
      ) +
      ",";

    // MPU6050 Accelerometer
    jsonPayload +=
      "\"accel_x\":" +
      String(
        a.acceleration.x,
        2
      ) +
      ",";

    jsonPayload +=
      "\"accel_y\":" +
      String(
        a.acceleration.y,
        2
      ) +
      ",";

    jsonPayload +=
      "\"accel_z\":" +
      String(
        a.acceleration.z,
        2
      ) +
      ",";

    // MPU6050 Gyroscope
    jsonPayload +=
      "\"gyro_x\":" +
      String(
        g.gyro.x,
        2
      ) +
      ",";

    jsonPayload +=
      "\"gyro_y\":" +
      String(
        g.gyro.y,
        2
      ) +
      ",";

    jsonPayload +=
      "\"gyro_z\":" +
      String(
        g.gyro.z,
        2
      );

    jsonPayload += "}";

    // ==========================================
    // 7. Print Data to Serial Monitor
    // ==========================================
    Serial.println(
      "--------------------------------------"
    );

    Serial.print("SOS: ");
    Serial.println(
      buttonPressed ? "PRESSED" : "Not Pressed"
    );

    Serial.print("MAX30102 IR: ");
    Serial.println(latestIR);

    Serial.print("MAX30102 RED: ");
    Serial.println(latestRed);

    Serial.print("Heart Rate: ");

    if (validHeartRate)
    {
      Serial.print(finalHeartRate);
      Serial.println(" BPM");
    }
    else
    {
      Serial.println("Invalid / No finger detected");
    }

    Serial.print("SpO2: ");

    if (validSpO2)
    {
      Serial.print(finalSpO2);
      Serial.println(" %");
    }
    else
    {
      Serial.println("Invalid / No reliable reading");
    }

    Serial.print("MAX30102 Temperature: ");
    Serial.print(max30102Temperature);
    Serial.println(" °C");

    Serial.println();

    Serial.print("Accel X: ");
    Serial.print(a.acceleration.x, 2);

    Serial.print(" | Y: ");
    Serial.print(a.acceleration.y, 2);

    Serial.print(" | Z: ");
    Serial.println(a.acceleration.z, 2);

    Serial.print("Gyro X: ");
    Serial.print(g.gyro.x, 2);

    Serial.print(" | Y: ");
    Serial.print(g.gyro.y, 2);

    Serial.print(" | Z: ");
    Serial.println(g.gyro.z, 2);

    Serial.println(
      "--------------------------------------"
    );

    // ==========================================
    // 8. Send Data to Firebase
    // ==========================================
    Serial.println(
      "Uploading data to Firebase..."
    );

    Serial.println(jsonPayload);

    bool status =
      Database.set<object_t>(
        aClient,
        "/sensor_data/latest",
        object_t(
          jsonPayload.c_str()
        )
      );

    if (status)
    {
      Serial.println(
        "✅ Firebase upload queued successfully."
      );
    }
    else
    {
      Serial.println(
        "❌ Error queuing upload:"
      );

      Serial.println(s
        aClient.lastError().message()
      );
    }
  }

  // ==========================================
  // Firebase Connection Waiting Message
  // ==========================================
  else if (
    !app.ready() &&
    (millis() - lastFirebaseUpdate >= 5000)
  )
  {
    lastFirebaseUpdate = millis();

    Serial.println(
      "⏳ Waiting for Firebase connection..."
    );

    Serial.println(
      aClient.lastError().message()
    );
  }
}