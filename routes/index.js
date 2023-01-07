var express = require("express");
const { auth, requiresAuth } = require("express-openid-connect");
var router = express.Router();
var Boat = require("../model/Boat");
require("dotenv").config();
const config = {
  authRequired: false,
  auth0Logout: true,
  baseURL: process.env.baseURL,
  clientID: process.env.clientID,
  issuerBaseURL: process.env.issuerBaseURL,
  secret: process.env.secret,
};
router.use(auth(config));

/* GET home page. */
router.get("/", function (req, res, next) {
  if (req.oidc.isAuthenticated()) res.redirect("/profile");
  else res.render("login");
});

router.get("/datatable", requiresAuth(), function (req, res, next) {
  res.render("datatable", { title: "Datatable" });
});

router.get("/profile", requiresAuth(), (req, res) => {
  var user = req.oidc.user;
  res.render("profile.ejs", { user: user });
});

router.get("/profilejson", async (req, res) => {
  try {
    var stringify = require("jsonld-stable-stringify");
    var user = req.oidc.user;
    var newUser = {
      "@context": "http://schema.org/",
      "@type": "Person",
      name: user.name,
      family_name: user.family_name,
      given_name: user.given_name,
      email: user.email,
      image: {
        "@type": "ImageObject",
        contentUrl: user.picture,
      },
    };

    console.log(newUser);
    res.json(newUser);
  } catch (e) {
    res.status(500).json({ code: 500, message: e.message });
  }
});

router.get("/csv", function (req, res) {
  res.render("Boatscsv");
});

router.get("/json", function (req, res) {
  res.render("Boatsjson");
});

router.get("/boats", async function (req, res) {
  var Boat = require("../model/Boat");
  var mongoose = require("mongoose");
  mongoose.connect(process.env.mongoURI);
  await Boat.find({}, (e, data) => {
    if (e) {
      console.log(e);
    } else {
      //console.log(data);
      res.send(data);
    }
  }).clone();
});

router.get("/feedTBL", function (req, res, next) {});

/**
 * @swagger
 * components:
 *   schemas:
 *     _id:
 *       type: object
 *       properties:
 *         $oid:
 *           type: string
 *     name:
 *       type: string
 *     model:
 *       type: string
 *     type:
 *       type: string
 *     year:
 *       type: integer
 *       format: int32
 *     length:
 *       type: string
 *     beam:
 *       type: string
 *     cabins:
 *       type: integer
 *       format: int32
 *     berths:
 *       type: integer
 *       format: int32
 *     wc:
 *       type: integer
 *       format: int32
 *     skipper:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         surname:
 *           type: string
 *         licence:
 *           type: string
 *     base:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         number:
 *           type: string
 */

/**
 * @swagger
 * /all:
 *  get:
 *    summary: Returns list of all boats
 *    responses:
 *      200:
 *        description: The list of boats
 *        content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *             $ref: 'schema.json'
 *      500:
 *        description: Error
 *        content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *               message:
 *                 type: string
 */
router.get("/all", async (req, res) => {
  try {
    var mongoose = require("mongoose");
    mongoose.connect(process.env.mongoURI);
    const boats = await Boat.find();
    res.json(boats);
  } catch (e) {
    res.status(500).json({ code: 500, message: e.message });
  }
});

/**
 * @swagger
 * /boats/one/{id}:
 *  get:
 *    summary: Returns boat with id
 *    parameters:
 *      - in: path
 *        name: id
 *        schema:
 *          type: string
 *        required: true
 *        description: The boat Id
 *    responses:
 *      200:
 *        description: The boat
 *        content:
 *         application/json:
 *           schema:
 *             $ref: 'schema.json'
 *      404:
 *        description: The boat was not found
 *      500:
 *        description: Error
 *        content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *               message:
 *                 type: string
 */
router.get("/one/:id", async (req, res) => {
  try {
    var mongoose = require("mongoose");
    mongoose.connect(process.env.mongoURI);
    const boat = await Boat.findById(req.params.id);

    if (boat) res.json(boat);
    else res.status(404).json({ code: 404, message: "Not Found" });
  } catch (e) {
    res.status(500).json({ code: 500, message: e.message });
  }
});

/**
 * @swagger
 * /skippers:
 *  get:
 *    summary: Returns list of all skippers
 *    responses:
 *      200:
 *        description: skippers
 *        content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: string
 *      500:
 *        description: Error
 *        content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *               message:
 *                 type: string
 */

router.get("/skippers", async (req, res) => {
  try {
    var mongoose = require("mongoose");
    mongoose.connect(process.env.mongoURI);
    const skippers = await Boat.find().distinct("skipper");

    var type = { "@type": "Person" };
    var newskippers = [];
    for (var i = 0; i < skippers.length; i++) {
      var newskipper = {};
      newskipper = type;
      newskipper.given_name = skippers[i].name;
      newskipper.family_name = skippers[i].surname;
      newskippers.push(newskipper);
    }
    var head = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      numberOfItems: newskippers.length,
      itemListElements: newskippers,
    };
    if (skippers) res.json(head);
    else res.status(404).json({ code: 404, message: "Not Found" });
  } catch (e) {
    res.status(500).json({ code: 500, message: e.message });
  }
});

/**
 * @swagger
 * /bases:
 *  get:
 *    summary: Returns list of all bases
 *    responses:
 *      200:
 *        description: bases
 *        content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               properties:
 *                name:
 *                  type: string
 *                number:
 *                  type: string
 *      500:
 *        description: Error
 *        content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *               message:
 *                 type: string
 */
router.get("/bases", async (req, res) => {
  try {
    var mongoose = require("mongoose");
    mongoose.connect(process.env.mongoURI);
    const bases = await Boat.find().distinct("base");

    var type = { "@type": "Place" };
    var newbases = [];
    for (var i = 0; i < bases.length; i++) {
      var newbase = {};
      newbase = type;
      newbase.name = bases[i].name;
      newbase.telephone = bases[i].number;
      newbases.push(newbase);
    }
    var head = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      numberOfItems: newbases.length,
      itemListElements: newbases,
    };
    if (bases) res.json(head);
    else res.status(404).json({ code: 404, message: "Not Found" });
  } catch (e) {
    res.status(500).json({ code: 500, message: e.message });
  }
});

/**
 * @swagger
 * /boats/:
 *  post:
 *    summary: Create new boat
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *             $ref: 'schema.json'
 *    responses:
 *      200:
 *        description: The boat
 *        content:
 *         application/json:
 *           schema:
 *             $ref: 'schema.json'
 *      500:
 *        description: Error
 *        content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *               message:
 *                 type: string
 */
router.post("/addBoat", async (req, res) => {
  const boat = new Boat({
    name: req.body.name,
    model: req.body.model,
    type: req.body.type,
    year: req.body.year,
    length: req.body.length,
    beam: req.body.beam,
    cabins: req.body.cabins,
    berths: req.body.berths,
    wc: req.body.wc,
    skipper: req.body.skipper,
    base: req.body.base,
  });

  try {
    var mongoose = require("mongoose");
    mongoose.connect(process.env.mongoURI);
    const newBoat = await boat.save();
    res.status(201).json(newBoat);
  } catch (e) {
    res.status(500).json({ code: 500, message: e.message });
  }
});

/**
 * @swagger
 * /boats/one/{id}:
 *  delete:
 *    summary: Deletes boat with id
 *    parameters:
 *      - in: path
 *        name: id
 *        schema:
 *          type: string
 *        required: true
 *        description: The boat Id
 *    responses:
 *      200:
 *        description: The Boat was deleted
 *      404:
 *        description: NotFOund
 *      500:
 *        description: Error
 *        content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *               message:
 *                 type: string
 *
 */
router.delete("/deleteOne/:id", async (req, res) => {
  var mongoose = require("mongoose");
  mongoose.connect(process.env.mongoURI);
  const boat = await Boat.findById(req.params.id);
  if (boat) {
    try {
      await boat.remove();
      res.json({ message: "Success" });
    } catch (e) {
      res.status(500).json({ code: 500, message: e.message });
    }
  } else {
    res.status(404).json({ code: 404, message: "Not Found" });
  }
});

/**
 * @swagger
 * /boats/one/{id}:
 *  put:
 *    summary: Upadates Boat
 *    parameters:
 *      - in: path
 *        name: id
 *        schema:
 *          type: string
 *        required: true
 *        description: The boat Id
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *             $ref: 'schema.json'
 *    responses:
 *      200:
 *        description: The boat
 *        content:
 *         application/json:
 *           schema:
 *             $ref: 'schema.json'
 *      500:
 *        description: Error
 *        content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *               message:
 *                 type: string
 */
router.put("/updateOne/:id", async (req, res) => {
  console.log(req.params.id);
  var brod = await Boat.findById(req.params.id);
  brod = {
    name: req.body.name,
    model: req.body.model,
    type: req.body.type,
    year: req.body.year,
    length: req.body.length,
    beam: req.body.beam,
    cabins: req.body.cabins,
    berths: req.body.berths,
    wc: req.body.wc,
    skipper: req.body.skipper,
    base: req.body.base,
  };
  try {
    const updatedBoat = await brod.save();
    res.status(201).json(updatedBoat);
  } catch (e) {
    res.status(500).json({ code: 500, message: e.message });
  }
});

module.exports = router;
