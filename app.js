//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
require("dotenv").config();

mongoose.set("strictQuery", false);

const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

//MONGOOSE<<<<<<<<<<<<<<
mongoose.connect("mongodb+srv://cheng-kang:Zhuckmongodb@todo-v2.l1jtr0q.mongodb.net/todolistDB");
// "mongodb://localhost:27017/todolistDB"
// mongodb://127.0.0.1:27017/todolistDB
// mongodb+srv://cheng-kang:Zhuckmongodb@todo-v2.l1jtr0q.mongodb.net/todolistDB
// process.env.MONGO_DB_URL

const itemSchema = new mongoose.Schema({
  name: String,
});

const Item = mongoose.model("item", itemSchema);

const item1 = new Item({
  name: "Welcome to your todolist!",
});
const item2 = new Item({
  name: "Hit the + button to add a new item",
});
const item3 = new Item({
  name: "<-- hit his to delete ann item",
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemSchema],
});

const List = mongoose.model("List", listSchema);

//MONGOOSE>>>>>>>>>>>>>>>>>>>>>>

//get routes <<<<
app.get("/", function (req, res) {
  Item.find({}, function (err, foundItems) {
    if (err) {
      console.log(err);
    } else {
      //add default items
      if (foundItems.length == 0) {
        Item.insertMany(defaultItems, (err) => {
          if (err) {
            console.log(err);
          } else {
            console.log("saved default item to database");
          }
        });
        res.redirect("/");
      }
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  });
});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }, function (err, result) {
    if (!err) {
      if (!result) {
        //create a new list
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        //show and exisiting list
        res.render("list", {
          listTitle: result.name,
          newListItems: result.items,
        });
      }
    }
  });
});

//get routes >>>>

// post routes <<<<

//add item
app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const currentListName = req.body.list;

  const item = new Item({
    name: itemName,
  });
  //add new item
  if (currentListName === "Today") {
    //if its default route then save the item to the database and redirect back to default route

    item.save();
    setTimeout(function () {
      res.redirect("/");
    }, 10);
  } else {
    //if its anther list then add item to the newly created list database

    List.findOne({ name: currentListName }, function (err, foundList) {
      foundList.items.push(item);
      foundList.save();

      setTimeout(function () {
        res.redirect("/" + currentListName);
      }, 10);
    });
  }
});

//delete item
app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  console.log(req.body);

  if (listName === "Today") {
    //if is default route then remove the item from data
    Item.findByIdAndRemove(checkedItemId, function (err, doc) {
      if (!err) {
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } },
      function (err, doc) {
        if (!err) {
          res.redirect("/" + listName);
        } else {
          console.log(err);
        }
      }
    );
  }
});

// post routes >>>>
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
