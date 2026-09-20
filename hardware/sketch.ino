/*
  ============================================================================
  SMART CAMPUS — Firmware ESP32 (borne RFID/NFC) — projet Wokwi
  ============================================================================
  Lit une carte étudiante (RC522), envoie l'évènement au backend Express
  (POST /api/hardware/scan) et affiche la réponse (autorisé / refusé /
  anomalie détectée) sur un écran OLED, avec retour LED + buzzer.

  Câblage RC522 -> ESP32 :
    SDA->5  SCK->18  MOSI->23  MISO->19  RST->22  3.3V->3.3V  GND->GND
  Câblage OLED SSD1306 (I2C, adresse 0x3C) -> ESP32 :
    SDA->21  SCL->4  VCC->3.3V  GND->GND   (SCL déplacé sur GPIO4 pour ne
    pas entrer en conflit avec le RST du RC522 sur GPIO22)
  LED verte -> GPIO25 | LED rouge -> GPIO26 | Buzzer -> GPIO27

  Bibliothèques : MFRC522, Adafruit_SSD1306, Adafruit_GFX, ArduinoJson
  ============================================================================
*/

#include <SPI.h>
#include <MFRC522.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

#define RFID_SS_PIN   5
#define RFID_RST_PIN  22
#define OLED_SDA      21
#define OLED_SCL      4
#define LED_VERTE     25
#define LED_ROUGE     26
#define BUZZER_PIN    27

MFRC522 rfid(RFID_SS_PIN, RFID_RST_PIN);
Adafruit_SSD1306 display(128, 64, &Wire, -1);

// ---------------------------------------------------------------------------
// Réseau : Wokwi fournit un accès Internet simulé via "Wokwi-GUEST"
// ---------------------------------------------------------------------------
const char* WIFI_SSID     = "Wokwi-GUEST";
const char* WIFI_PASSWORD = "";

// Avec le Wokwi IoT Gateway (wokwigw) lancé sur votre machine, le simulateur
// peut atteindre votre backend local via l'hôte spécial "host.wokwi.internal"
// (voir README.md, section "Wokwi Gateway"). Sans gateway, remplacez par
// l'URL publique d'un backend déployé (Render, Railway, etc.).
const char* SERVER_URL   = "http://host.wokwi.internal:4000/api/hardware/scan";
const char* DEVICE_KEY   = "demo-device-key-please-change"; // doit matcher `devices.api_key`

const char* SERVICES[] = {"restaurant", "bibliotheque", "transport", "photocopie"};

void setup() {
  Serial.begin(115200);
  pinMode(LED_VERTE, OUTPUT);
  pinMode(LED_ROUGE, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);

  SPI.begin();
  rfid.PCD_Init();

  Wire.begin(OLED_SDA, OLED_SCL);
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println(F("Ecran OLED non detecte"));
  }
  afficher("Smart Campus", "Connexion WiFi...");

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int tentative = 0;
  while (WiFi.status() != WL_CONNECTED && tentative < 20) {
    delay(300);
    tentative++;
  }
  Serial.println(WiFi.status() == WL_CONNECTED
    ? "WiFi connecte : " + WiFi.localIP().toString()
    : "WiFi indisponible - fonctionnement en mode local");

  afficher("Smart Campus", "Approchez une carte");
}

void loop() {
  if (!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial()) {
    delay(50);
    return;
  }

  String uid = lireUID(rfid.uid.uidByte, rfid.uid.size);
  String service = SERVICES[random(0, 4)];

  Serial.println("Carte detectee : " + uid + " | service demande : " + service);
  afficher("Lecture...", uid);

  envoyerScan(uid, service);

  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
  delay(1500);
  afficher("Smart Campus", "Approchez une carte");
}

String lireUID(byte* buffer, byte bufferSize) {
  String uid = "";
  for (byte i = 0; i < bufferSize; i++) {
    if (buffer[i] < 0x10) uid += "0";
    uid += String(buffer[i], HEX);
  }
  uid.toUpperCase();
  return uid;
}

void envoyerScan(String uid, String service) {
  if (WiFi.status() != WL_CONNECTED) {
    afficher("Hors ligne", "Pas de connexion");
    signaler(false, false);
    return;
  }

  StaticJsonDocument<200> body;
  body["uid"] = uid;
  body["service"] = service;
  body["timestamp"] = millis();
  String payload;
  serializeJson(body, payload);

  HTTPClient http;
  http.begin(SERVER_URL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-device-key", DEVICE_KEY);

  int code = http.POST(payload);

  if (code <= 0) {
    Serial.println("Erreur HTTP : " + String(code));
    afficher("Erreur reseau", "Reessayez");
    signaler(false, false);
    http.end();
    return;
  }

  String response = http.getString();
  Serial.println("Reponse (" + String(code) + ") : " + response);
  http.end();

  StaticJsonDocument<300> res;
  DeserializationError err = deserializeJson(res, response);
  if (err) {
    afficher("Erreur", "Reponse invalide");
    return;
  }

  String status = res["status"] | "REFUSE";
  String message = res["message"] | "";
  double balance = res["balance"] | 0.0;

  afficher(message, "Solde: " + String((int)balance) + " FCFA");

  if (status == "OK") signaler(true, false);
  else if (status == "FRAUDE") signaler(false, true);
  else signaler(false, false);
}

void signaler(bool ok, bool fraude) {
  if (ok) {
    digitalWrite(LED_VERTE, HIGH);
    tone(BUZZER_PIN, 1500, 150);
    delay(1000);
    digitalWrite(LED_VERTE, LOW);
  } else if (fraude) {
    for (int i = 0; i < 3; i++) {
      digitalWrite(LED_ROUGE, HIGH);
      tone(BUZZER_PIN, 800, 100);
      delay(150);
      digitalWrite(LED_ROUGE, LOW);
      delay(150);
    }
  } else {
    digitalWrite(LED_ROUGE, HIGH);
    tone(BUZZER_PIN, 400, 400);
    delay(800);
    digitalWrite(LED_ROUGE, LOW);
  }
}

void afficher(String ligne1, String ligne2) {
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 15);
  display.println(ligne1);
  display.setCursor(0, 35);
  display.println(ligne2);
  display.display();
}
