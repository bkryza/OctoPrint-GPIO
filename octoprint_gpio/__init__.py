# coding=utf-8
from __future__ import absolute_import

### (Don't forget to remove me)
# This is a basic skeleton for your plugin's __init__.py. You probably want to adjust the class name of your plugin
# as well as the plugin mixins it's subclassing from. This is really just a basic skeleton to get you started,
# defining your plugin as a template plugin, settings and asset plugin. Feel free to add or remove mixins
# as necessary.
#
# Take a look at the documentation on what other plugin mixins are available.

import octoprint.plugin

from enum import Enum
from gpiozero.pins.mock import MockFactory
from gpiozero import DigitalOutputDevice, Button, PWMOutputDevice, Servo

class GpioPlugin(
        octoprint.plugin.StartupPlugin,
        octoprint.plugin.SettingsPlugin,
        octoprint.plugin.AssetPlugin,
        octoprint.plugin.TemplatePlugin,
        octoprint.plugin.SimpleApiPlugin,
):
    def __init__(self):
        self.pins = {}

    ##~~ StartupPlugin mixin
    def on_after_startup(self):
        self.update_pin_bindings()

    ##~~ SimpleApiPlugin mixin
    def get_api_commands(self):
        return dict(set_gpio=["gpio", "value"])

    def on_api_command(self, command, data):
        import flask
        if command == "set_gpio":
            self._logger.error("set_gpio called with {data}".format(data=data))
            pin = int(data["gpio"])
            value = int(data["value"])
            if pin not in self.pins:
                return flask.make_response(
                    "Pin {pin} not defined".format(pin=pin), 404)
            self.set_gpio(pin, value)

    ##~~ SettingsPlugin mixin
    def get_settings_defaults(self):
        return dict(
            bindings=[{
                "gpio": k,
                "type": ["UNDEFINED"]
            } for k in range(0, 27)],
            gpioTypes=["UNDEFINED", "OUTPUT", "INPUT", "PWM", "SERVO"],
            gpioFactories=["Native", "PiGPIO", "RPIO", "RPi.GPIO", "Mock"])

    def on_settings_initialized(self):
        pass  # self.update_pin_bindings()

    def get_settings_version(self):
        return 1

    ##~~ AssetPlugin mixin
    def get_assets(self):
        # Define your plugin's asset files to automatically include in the
        # core UI here.
        return dict(js=["js/gpio.js"],
                    css=["css/gpio.css"],
                    less=["less/gpio.less"])

    ##~~ Softwareupdate hook
    def get_update_information(self):
        # Define the configuration for your plugin to use with the Software Update
        # Plugin here. See https://docs.octoprint.org/en/master/bundledplugins/softwareupdate.html
        # for details.
        return dict(gpio=dict(
            displayName="Gpio Plugin",
            displayVersion=self._plugin_version,
            # version check: github repository
            type="github_release",
            user="bkryza",
            repo="OctoPrint-GPIO",
            current=self._plugin_version,
            # update method: pip
            pip=
            "https://github.com/bkryza/OctoPrint-GPIO/archive/{target_version}.zip",
        ))

    def update_pin_bindings(self):
        bindings = self._settings.get(["bindings"])
        self._logger.error(str(bindings))
        for gpio in bindings:
            pin = int(gpio["gpio"])
            if gpio["type"][0] == "OUTPUT":
                self._logger.error(
                    "Binding DigitalOutputDevice to pin {pin}".format(pin=pin))
                self.pins[pin] = DigitalOutputDevice(pin,
                                     active_high=True,
                                     initial_value=True,
                                     pin_factory=MockFactory())
            if gpio["type"][0] == "INPUT":
                self._logger.error(
                    "Binding Button to pin {pin}".format(pin=pin))
                self.pins[pin] = Button(pin,
                                        active_state=None,
                                        pull_up=True,
                                        bounce_time=0.01,
                                        pin_factory=MockFactory())
            if gpio["type"][0] == "PWM":
                self._logger.error("Binding PWM to pin {pin}".format(pin=pin))
                self.pins[pin] = PWMOutputDevice(pin,
                                     active_high=True,
                                     initial_value=0.0,
                                     frequency=100,
                                     pin_factory=MockFactory())
            if gpio["type"][0] == "SERVO":
                self._logger.error(
                    "Binding Servo to pin {pin}".format(pin=pin))
                self.pins[pin] = Servo(pin,
                                       initial_value=0.0,
                                       min_pulse_width=1 / 1000,
                                       max_pulse_width=2 / 1000,
                                       frame_width=20 / 1000,
                                       pin_factory=MockFactory())

    def set_gpio(self, pin, value):
        self._logger.error("Setting pin {pin} to value {value}".format(
            pin=pin, value=value))
        device = self.pins[pin]
        if isinstance(device, DigitalOutputDevice):
            self.pins[pin].value = bool(value)
        if isinstance(device, PWMOutputDevice):
            self.pins[pin].value = value/100.0
        if isinstance(device, Servo):
            self.pins[pin].value = value/100.0


# If you want your plugin to be registered within OctoPrint under a different name than what you defined in setup.py
# ("OctoPrint-PluginSkeleton"), you may define that here. Same goes for the other metadata derived from setup.py that
# can be overwritten via __plugin_xyz__ control properties. See the documentation for that.
__plugin_name__ = "Gpio Plugin"

# Starting with OctoPrint 1.4.0 OctoPrint will also support to run under Python 3 in addition to the deprecated
# Python 2. New plugins should make sure to run under both versions for now. Uncomment one of the following
# compatibility flags according to what Python versions your plugin supports!
# __plugin_pythoncompat__ = ">=2.7,<3" # only python 2
__plugin_pythoncompat__ = ">=3,<4"  # only python 3
# __plugin_pythoncompat__ = ">=2.7,<4" # python 2 and 3


def __plugin_load__():
    global __plugin_implementation__
    __plugin_implementation__ = GpioPlugin()

    global __plugin_hooks__
    __plugin_hooks__ = {
        "octoprint.plugin.softwareupdate.check_config":
        __plugin_implementation__.get_update_information
    }
