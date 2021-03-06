module.exports = CInventory;

var CWebRequest = require('./CWebRequest.js');
var CItem = require('./CItem.js');

function CInventory(steamid64, schema) {
	this.schema = schema;
	this.steamid64 = steamid64;
}

CInventory.prototype.fetch = function(apiKey, callback) {
	var self = this;
	new CWebRequest("GET", "GetPlayerItems", "v0001", { steamid: self.steamid64, key: apiKey }, function(err, body) {
		if (err) {
			callback(err);
			return;
		}

		var result = body.result;
		self.status = result.status;

		self._parse(result);

		callback(null, self.status == 1);
	});
};

CInventory.prototype.getSummary = function() {
	var names = {};

	this.items.forEach((item) => {
		var name = this.schema.getDisplayName(item);
		names[name] = (names[name] || 0) + 1;
	});

	return names;
};

CInventory.prototype._parse = function(result) {
	if (this.status == 15) {
		this.isPrivate = true;
	} else if (this.status == 1) {
		this.maxItems = result.num_backpack_slots;
		this._parseItems(result.items);
	}
};

CInventory.prototype.isPrivate = function() {
	return this.status == 15;
};

CInventory.prototype._parseItems = function(items) {
	var parsed = [];
	for (var i = 0; i < items.length; i++) {
		var item = this._parseItem(items[i]);
		parsed.push(item);
	}
	this.items = parsed;
};

CInventory.prototype._parseItem = function(item) {
	var attributes = this.getAttributes(item);
	item.attributes = attributes;

	var parsed = new CItem(item);
	return parsed;
};

// We need a more sophisticated way of identifying items and getting the attributes, because this is bad in my oppinion.
CInventory.prototype.getAttributes = function(item) {
	if (!Array.isArray(item.attributes)) {
		// Item has no attributes.
		return {};
	}

	return this._getAttributeValues(item);
};

CInventory.prototype._getAttributeValues = function(item) {
	var defindexes = {
		australium: 2027,
		killstreak: 2025,
		unusual_effect: 134,
		decorated: 834
	};

	var attributes = {};

	for (var i = 0; i < item.attributes.length; i++) {
		var attribute = item.attributes[i];
		if (attribute.defindex == defindexes.killstreak) {
			attributes.killstreak = attribute.float_value;
		} else if (attribute.defindex == defindexes.australium) {
			attributes.australium = true;
		} else if (attribute.defindex == defindexes.unusual_effect) {
			attributes.effect = attribute.float_value;
		} else if (attribute.defindex == defindexes.decorated) {
			attributes.decorated = true;
		}
	}

	return attributes;
};