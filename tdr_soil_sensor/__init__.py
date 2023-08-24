import esphome.codegen as cg
import esphome.config_validation as cv
from esphome import pins
from esphome import components as cp
from esphome.components import sensor, text_sensor, number,switch,   gpio, i2c
from esphome.components import web_server_base
from esphome.components.web_server_base import CONF_WEB_SERVER_BASE_ID
from esphome.core import CORE, coroutine_with_priority
from esphome import automation
from esphome.const import (
    CONF_ID,
    CONF_INITIAL_VALUE,
    CONF_LAMBDA,
    CONF_MAX_VALUE,
    CONF_MIN_VALUE,
    CONF_OPTIMISTIC,
    CONF_MODE,
    CONF_RESTORE_VALUE,
    CONF_INITIAL_VALUE,
    CONF_STEP,
    UNIT_CELSIUS,
    DEVICE_CLASS_EMPTY,
    STATE_CLASS_MEASUREMENT
)
CONFIG_PIN_RE = "pin_re"
CONFIG_PIN_DE =  "pin_de"
CONFIG_PIN_TX = "pin_tx"
CONFIG_PIN_RX = "pin_rx"
CONF_TEMPERATURE = "temperature"
CONF_HUMIDITY =  "humidity"
CONF_BULK_PERMITTIVITY = "bulk_permittivity"
CONF_PORE_WATER = "pore_water"
CONF_EC =  "ec"
MULTI_CONF = True
print(cp)

DEPENDENCIES = ['esp32']
AUTO_LOAD = ["sensor"]

tdr_soil_sensor__ns = cg.esphome_ns.namespace("tdr_soil_sensor_")
TDR_SOIL_SENSOR = tdr_soil_sensor__ns.class_("TDR_Soil_Sensor", cg.Component)


#DIGITAL_SWITCH = digital_pump_ns.class_("DigitalSwitch", switch.Switch, cg.Component)


#template_number_ns = cg.esphome_ns.namespace("digital_pump")
#TemplateNumber = template_number_ns.class_("TemplateNumber",number.Number, cg.PollingComponent)

CONFIG_SCHEMA = cv.Schema({
      cv.GenerateID(): cv.declare_id(TDR_SOIL_SENSOR),
      cv.Required(CONFIG_PIN_TX):int,
      cv.Required(CONFIG_PIN_RX):int,
      cv.Required(CONFIG_PIN_DE):int,
      cv.Required(CONFIG_PIN_RE):int,
      cv.Optional(CONF_TEMPERATURE):sensor.sensor_schema(
                unit_of_measurement=UNIT_CELSIUS,
                accuracy_decimals=2,
                device_class=DEVICE_CLASS_EMPTY,
                state_class=STATE_CLASS_MEASUREMENT,
        ),
        cv.Optional(CONF_HUMIDITY):sensor.sensor_schema(
                unit_of_measurement=" %",
                accuracy_decimals=2,
                device_class=DEVICE_CLASS_EMPTY,
                state_class=STATE_CLASS_MEASUREMENT,
        ),
        cv.Optional(CONF_EC):sensor.sensor_schema(
                unit_of_measurement="",
                accuracy_decimals=2,
                device_class=DEVICE_CLASS_EMPTY,
                state_class=STATE_CLASS_MEASUREMENT,
        ),
        cv.Optional(CONF_PORE_WATER):sensor.sensor_schema(
                unit_of_measurement="",
                accuracy_decimals=2,
                device_class=DEVICE_CLASS_EMPTY,
                state_class=STATE_CLASS_MEASUREMENT,
        ),
        cv.Optional(CONF_BULK_PERMITTIVITY):sensor.sensor_schema(
                unit_of_measurement="",
                accuracy_decimals=2,
                device_class=DEVICE_CLASS_EMPTY,
                state_class=STATE_CLASS_MEASUREMENT,
        ),

    }).extend(cv.polling_component_schema("60s"))


#@coroutine_with_priority(45.0)
async def to_code(config):
    var =  cg.new_Pvariable(config[CONF_ID])
    await cg.register_component(var, config)
    #await cg.register_component(var, config)
    
    if CONFIG_PIN_TX in config:
        pin = config[CONFIG_PIN_TX]
        cg.add(var.set_pin_tx( pin))
    
    if CONFIG_PIN_RX in config:
        pin = config[CONFIG_PIN_RX]
        cg.add(var.set_pin_rx( pin))

    if CONFIG_PIN_DE in config:
        pin = config[CONFIG_PIN_DE]
        cg.add(var.set_pin_de( pin))
    
    if CONFIG_PIN_RE in config:
        pin = config[CONFIG_PIN_RE]
        cg.add(var.set_pin_re( pin))



    if CONF_TEMPERATURE in config:
        conf = config[CONF_TEMPERATURE]
        sens = await sensor.new_sensor(conf)
        cg.add(var.set_temperature_sensor(sens))


    if CONF_HUMIDITY in config:
        conf = config[CONF_HUMIDITY]
        sens = await sensor.new_sensor(conf)
        cg.add(var.set_humidity_sensor(sens))

    if CONF_EC in config:
        conf = config[CONF_EC]
        sens = await sensor.new_sensor(conf)
        cg.add(var.set_ec_sensor(sens))

    if CONF_PORE_WATER in config:
        conf = config[CONF_PORE_WATER]
        sens = await sensor.new_sensor(conf)
        cg.add(var.set_pore_water_sensor(sens))

    if CONF_BULK_PERMITTIVITY in config:
        conf = config[CONF_BULK_PERMITTIVITY]
        sens = await sensor.new_sensor(conf)
        cg.add(var.set_bulk_permittivity_sensor(sens))


