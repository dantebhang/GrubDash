const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

//get /dishes
function list(req, res) {
	res.json({ data: dishes });
}

//middleware for /dishes
function bodyHasAllProperty(req, res, next) {
	const {
		data: { name, description, price, image_url },
	} = req.body;

	if (!name || name === "") {
		next({
			status: 400,
			message: "Dish must include a name",
		});
	}
	if (!description || description === "") {
		next({
			status: 400,
			message: "Dish must include a description",
		});
	}
	if (!price) {
		next({
			status: 400,
			message: "Dish must include a price",
		});
	}
	if (price <= 0 || !Number.isInteger(price)) {
		next({
			status: 400,
			message: "Dish must have a price that is an integer greater than 0",
		});
	}
	if (!image_url || image_url === "") {
		next({
			status: 400,
			message: "Dish must include a image_url",
		});
	}
	return next();
}

//post /dishes
function create(req, res) {
	const {
		data: { name, description, price, image_url },
	} = req.body;
	const newDish = {
		id: nextId(),
		name,
		description,
		price,
		image_url,
	};
	dishes.push(newDish);
	res.status(201).json({ data: newDish });
}

//middleware for /dishes/:dishId
function dishExists(req, res, next) {
	const { dishId } = req.params;
	const foundDish = dishes.find((dish) => dish.id === dishId);
	if (foundDish) {
		res.locals.dish = foundDish;
		return next();
	}
	next({
		status: 404,
		message: `Dish Id of ${dishId} is not found.`,
	});
}

//get for /dishes/:dishId
function read(req, res) {
	res.json({ data: res.locals.dish });
}

//middleware for ID validation in update
function IdIsValid(req, res, next){
	const { dishId } = req.params;
	const {data: {id}} = req.body;
	if(!id){
		next()
	}
	if(id !== dishId){
		next({
			status: 400, 
			message: `The id of ${id} does not match ${dishId}`
		})
	}
	return next()
}

//put for /dishes/:dishId
function update(req, res) {
	
	const {
		data: {  name, description, price, image_url },
	} = req.body;
	
	const dish = res.locals.dish;
	
	dish.name = name;
	dish.description = description;
	dish.price = price;
	dish.image_url = image_url;
	res.json({ data: dish });
}

module.exports = {
	list,
	create: [bodyHasAllProperty, create],
	read: [dishExists, read],
	update: [dishExists, bodyHasAllProperty, IdIsValid, update],
	dishExists,
};
