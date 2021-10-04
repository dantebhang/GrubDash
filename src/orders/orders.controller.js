const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

//get /orders
function list(req, res) {
	res.json({ data: orders });
}

//middleware for /orders
function areValidProps(objName, props) {
	for (const key of Object.keys(props)) {
		if (!props[key]) {
			return { bool: false, message: `${objName} must include a ${key}` };
		}
	}
	return { bool: true };
}

function isValidArray(dishes) {
	return Array.isArray(dishes) && dishes.length > 0;
}

function hasQuantity(dishes) {
	for (let i = 0; i < dishes.length; i++) {
		const dish = dishes[i];
		const bool = dish.quantity && Number.isInteger(dish.quantity);
		if (!bool || dish.quantity <= 0) {
			return {
				bool: false,
				message: `Dish ${i} must have a quantity that is an integer greater than zero.`,
			};
		}
	}
	return { bool: true };
}

const isValidOrder = (req, res, next) => {
	const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;
	const validation = areValidProps("Order", {
		deliverTo: deliverTo,
		mobileNumber: mobileNumber,
		dishes: dishes,
	});
	if (!validation.bool) {
		return next({ status: 400, message: validation.message });
	}
	if (!isValidArray(dishes)) {
		return next({
			status: 400,
			message: `Order must include at least one dish`,
		});
	}
	const arrValidation = hasQuantity(dishes);
	if (!arrValidation.bool) {
		return next({ status: 400, message: arrValidation.message });
	}
	next();
};

//post for /orders
function create(req, res) {
	const {
		data: { deliverTo, mobileNumber, status, dishes },
	} = req.body;
	const newOrder = {
		id: nextId(),
		deliverTo,
		mobileNumber,
		status,
		dishes, //copy of dish how to match ??
	};
	orders.push(newOrder);
	res.status(201).json({ data: newOrder });
}

//middleware for /:orderId
function orderExists(req, res, next) {
	const { orderId } = req.params;
	const foundOrder = orders.find((order) => orderId === order.id);
	if (foundOrder) {
		res.locals.order = foundOrder;
		next();
	}
	next({
		status: 404,
		message: `Order Id of ${orderId} is not found.`,
	});
}

//get for /:orderId
function read(req, res) {
	res.json({ data: res.locals.order });
}

//middleware for update status field
function bodyHasStatusField(req, res, next) {
	const {
		data: { status = {} },
	} = req.body;

	if (!status || status === "") {
		//adding status strings fails tests
		next({
			status: 400,
			message: `A delivered order cannot be changed; must have a different status`,
		});
	}
	if (status === "delivered") {
		next({
			status: 400,
			message: "A delivered order cannot be changed",
		});
	}
	const validStatuses = ["pending", "preparing", "out-for-delivery"];
	if (!validStatuses.includes(status)) {
		return next({
			status: 400,
			message: `Order must have a status of pending, preparing, out-for-delivery, or delivered`,
		});
	}

	next();
}

//middleware for ID validation in update
function idMatch(req, res, next) {
	const { data: { id } = {} } = req.body;
	if (!id) {
		return next();
	}
	if (id !== res.locals.order.id) {
		return next({
			status: 400,
			message: `Order id does not match route id. Order: ${res.locals.order.id}, Route: ${id}`,
		});
	}
	next();
}

//put for /:orderId
function update(req, res) {
	const {
		data: { deliverTo, mobileNumber, status },
	} = req.body;
	const order = res.locals.order;
	order.deliverTo = deliverTo;
	order.mobileNumber = mobileNumber;
	order.status = status;
	res.json({ data: order });
}

//middleware for delete
function statusValid(req, res, next) {
	const { data: { status } = {} } = req.body;
	const validStatuses = ["pending", "preparing", "out-for-delivery"];
	if (!status || !validStatuses.includes(status)) {
		return next({
			status: 400,
			message: `Order must have a status of pending, preparing, out-for-delivery, delivered.`,
		});
	}
	if (status === "delivered") {
		return next({
			status: 400,
			message: `A delivered order cannot be changed; must have a different status`,
		});
	}
	
	next();
}

function destroy(req, res) {
	const { orderId } = req.params;
	const index = orders.findIndex((order) => order.id === orderId);
	if (index > -1) {
		orders.splice(index, 1);
	}
	res.sendStatus(204);
}

const isOrderPending = (req, res, next) => {
	if (res.locals.order.status !== "pending") {
		return next({
			status: 400,
			message: "An order cannot be deleted unless it is pending",
		});
	}
	next();
};

module.exports = {
	list,
	create: [isValidOrder, create],
	read: [orderExists, read],
	update: [orderExists, isValidOrder, bodyHasStatusField, idMatch, update],
	destroy: [orderExists, isOrderPending, destroy],
};
