# TDR-Sensor
A TDR sensor that measures moisture content, EC, and temperature for Rockwool Substrates or Soil Substrates.

This is a conversion to work with ESP Home and Home Assistant. 

Still in beta stages not sure if the numbers are correct. 

This is leveraging off the work done by DIY Guy and Kromadg https://github.com/kromadg/soil-sensor#crop-steering-references

The devices used for this are the THC-S (must be the S model) fomr ali express. 

M5 Stack RS485 converter
https://shop.m5stack.com/products/rs485-module

M% Stack Atom S3 Lite
https://shop.m5stack.com/products/atoms3-lite-esp32s3-dev-kit

THC-S TDR Sensor 
![THC-S](https://github.com/JakeTheRabbit/TDR-Sensor/assets/123831499/ea930549-49fb-4f87-b6bd-3b73210863cc)


Instructions: 
- put the components folder in esphome
- copy the yaml and adjust to your settings
- usual ESP Home install.


There are three versions
tdr_soil_sensor is the first implementation converting the Arduino code to Esphome . The all code is identical to the Arduino code. There was zero point in making this.
tdr_soil_sensor_2 is the complete rewriting of the modbus sensor with the home assistant template yaml calibration previously in configuration.yaml now as a component this is for  coco coir calibration. 
tdr_soil_sensor_3 is identical to the second one in the implementation but has the Arduino code file calibration for Rockwool by Emperisium.
