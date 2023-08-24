#include"tdr_soil_sensor.h"
#include "esphome/core/log.h"
#include <SoftwareSerial.h>
#include <Wire.h>


static const float TEMP_CORRECTION = 0.5;
static const float HUM_CORRECTION = 0.8;
static const float EC_SLOPE = 1.93;
static const float EC_INTERCEPT = -270.8;
static const float EC_TEMP_COEFF = 0.019;
static const byte hum_temp_ec[8] = {0x01, 0x03, 0x00, 0x00, 0x00, 0x03, 0x05, 0xCB};
static byte sensorResponse[13] = {0};

static const char *TAG = "TDR Soil Sensor" ;
static EspSoftwareSerial::UART mod;

// Calculate CRC
static uint8_t calculateCRC(const byte *data, size_t len) {
  uint8_t crc = 0;
  for (size_t i = 0; i < len; i++) {
    crc ^= data[i];
  }
  return crc;
}

namespace esphome {
  namespace  tdr_soil_sensor_{
     void TDR_Soil_Sensor::setup(){
      ESP_LOGI(TAG, "Initialization");
       pinMode(pin_re, OUTPUT);
       pinMode(pin_de, OUTPUT);
       digitalWrite(pin_re, LOW);
       digitalWrite(pin_de, LOW);
       //SoftwareSerial mod(D6, D5);

       mod.begin(4800, SWSERIAL_8N1, pin_rx, pin_tx, false);
       if(!mod){
        ESP_LOGE(TAG, "Error Initializing the Modbus Serial");
        ESP_LOGE(TAG, "Please check  the provided RX, TX pins and try again");
       }else {
        ESP_LOGI(TAG, "Sensor Interface Initialized successfully");
       }

       

     };

     void TDR_Soil_Sensor::dump_config(){
       ESP_LOGCONFIG(TAG, "TDR Soil Sensor Configurations");
       ESP_LOGCONFIG(TAG, "TDR TX Pin : %d ",this->pin_tx);
       ESP_LOGCONFIG(TAG, "TDR RX Pin : %d ",this->pin_rx);
       ESP_LOGCONFIG(TAG, "TDR RE Pin : %d ",this->pin_re);
       ESP_LOGCONFIG(TAG, "TDR DE Pin : %d ",this->pin_de);
     };
  
     /** Read and publish data to the sensors
     */
     void TDR_Soil_Sensor::update(){
         ESP_LOGI(TAG, "Starting new measurement");



        digitalWrite(pin_de, HIGH);
        digitalWrite(pin_re, HIGH);
        memset(sensorResponse, 0, sizeof(sensorResponse));
        delay(100);

       if (mod.write(hum_temp_ec, sizeof(hum_temp_ec)) == 8) 
       {
          digitalWrite(pin_de, LOW);
          digitalWrite(pin_re, LOW);
          for (byte i = 0; i < 13; i++) {
            sensorResponse[i] = mod.read();
            yield();
          }
      }

       delay(250);

       if (calculateCRC(sensorResponse, 12) != sensorResponse[12]) 
       {
        ESP_LOGE(TAG," Sensor data CRC check failed. Skipping this iteration.");
        ESP_LOGE(TAG, "The sensors reading won't be updated to new values");
        return;
       }

      // Sensor Response Data
      float soil_hum = 0.1 * int(sensorResponse[3] << 8 | sensorResponse[4]);
      float soil_temp = 0.1 * int(sensorResponse[5] << 8 | sensorResponse[6]);
      int soil_ec = int(sensorResponse[7] << 8 | sensorResponse[8]);


      // EC, Humidity, and Temperature Correction
      // Soil EC Equations obtained from calibration using distilled water and a 1.1178 mS/cm solution
      soil_ec = EC_SLOPE * soil_ec + EC_INTERCEPT;
      soil_ec = soil_ec / (1.0 + EC_TEMP_COEFF * (soil_temp - 25));

      // Study by Shang et al. 2020 showed that the temperature readings of THC-S Sensor were consistently lower than those of Teros 11 by 0.5 degrees Celsius
      soil_temp = soil_temp + TEMP_CORRECTION;
      
      // 80% soil humidity correction for rockwool
      soil_hum = soil_hum * HUM_CORRECTION;

      // Updated Formula for calculating the apparent dielectric constant of soil based on Briciu-Burghina 2022. Corrected for Rockwool
      float soil_apparent_dieletric_constant = 1.68 + 0.267 * soil_hum - 0.00476 * soil_temp + 0.000101 * soil_temp * soil_temp;
      float soil_bulk_permittivity = soil_apparent_dieletric_constant;
      float soil_pore_permittivity = 80.3 / (1.0 + 0.06 * (soil_temp - 25.0));

      // Calculate soil pore water EC using the Briciu-Burghina 2022 model
      float soil_pore_water_ec;
      if (soil_bulk_permittivity > 5.5)
        soil_pore_water_ec = (soil_ec * (soil_pore_permittivity - 5.5)) / (soil_bulk_permittivity - 5.5) / 1000.0;
      else
        soil_pore_water_ec = 0.0;


     // Publish the sensor data to esphome 
     if(this->temperature_sensor_){
      this->temperature_sensor_->publish_state(soil_temp);
     }
     if(this->humidity_sensor_){
      this->humidity_sensor_->publish_state(soil_hum);
     }
     if(this->ec_sensor_){
      this->ec_sensor_->publish_state(soil_ec);
     }

     if(this->bulk_permittivity_sensor_){
       this->bulk_permittivity_sensor_->publish_state(soil_bulk_permittivity);
     }

     if(this->pore_water_sensor_){
      this->pore_water_sensor_->publish_state(soil_pore_water_ec);
     }


     };  
  };
};