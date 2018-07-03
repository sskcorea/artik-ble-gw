var bluetooth = require("artik-sdk/src").bluetooth;

var SERVICE_THERMOMETER = "00001809-0000-1000-8000-00805f9b34fb";
var GATT_CHAR_TEMP_MEASUREMENT = "00002a1c-0000-1000-8000-00805f9b34fb";

var filter = new bluetooth.Filter(-90, [ SERVICE_THERMOMETER ], "le");
var temp_measurement = null;
var bt = new bluetooth();
var remote_addr = null;

function includes(array, elem) {
	for (var i = 0; i < array.length; i++) {
		if (array[i] == elem)
			return true;
	}

	return false;
}

bt.on('started', function() {
	console.log('onstarted');
	bt.set_scan_filter(filter);
	bt.on('scan', function(err, device) {
		if (err) {
			console.log("Error: " +err);
			process.exit();
		}
		device = JSON.parse(device);
		remote_addr = device[0].address;
		bt.connect(device[0].address);
		bt.stop_scan();
	});

	bt.on('connect', function(err, connected) {
		if (err) {
			console.log("Error: " +err);
			process.exit();
		}
	});

	var gatt_client = new bluetooth.GattClient();
	gatt_client.on('servicesDiscover', function() {
		var services = gatt_client.discover_services(remote_addr);

		var thermometer = services.find(function(service) {
			console.log("service.uuid = " + service.uuid);
			return service.uuid == SERVICE_THERMOMETER
		});

		var characteristics = thermometer.discover_characteristics();
		temp_measurement = characteristics.find(function(chr) { return chr.uuid == GATT_CHAR_TEMP_MEASUREMENT});

		var include_indicate = includes(temp_measurement.properties, "indicate");
		if (include_indicate) {
			temp_measurement.on("data", function(buffer) {
				console.log(buffer);
			});
			temp_measurement.subscribe();
			process.on('SIGINT', function() {
				temp_measurement.unsubscribe();
				process.exit(0);
			});
		}
	});

	bt.start_scan();
});
