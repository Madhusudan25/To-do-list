const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const _ = require("lodash");
const dotenv=require("dotenv");

const app = express();
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");

dotenv.config();

mongoose.connect(
  `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.l6ubm.mongodb.net/finalToDoListDB`,
  { useNewUrlParser: true },
  { useUnifiedTopology: true }
);

const itemSchema = {
  name: String,
};

const Item = mongoose.model("Item", itemSchema);

const item1 = new Item({
  name: "Welcome to your to do list",
});

const item2 = new Item({
  name: "Hit the + button to add a new item",
});

const item3 = new Item({
  name: "<--Hit this to delete an item",
});

const defaultList = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemSchema],
};

const List = mongoose.model("List", listSchema);

var first = 1;

app.get("/", function (req, res) {
  Item.find(function (err, foundItems) {
    if (first === 1 && foundItems.length === 0) {
      first = 0;
      Item.insertMany(defaultList, function (err) {});
      res.redirect("/");
    } else {
      res.render("toDoList", { listTitle: "Today", listItems: foundItems });
    }
  });
});

app.post("/", function (req, res) {
  const listName = req.body.listName;
  const newItem = new Item({
    name: req.body.newItem,
  });

  if (listName === "Today") {
    newItem.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, function (err, foundItems) {
      if (!err) {
        foundItems.items.push(newItem);
        foundItems.save();
        res.redirect("/" + foundItems.name);
      }
    });
  }
});

app.post("/delete", function (req, res) {
  const checkedId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove({ _id: checkedId }, function (err, foundItem) {
      if (!err) {
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedId } } },
      function (err, foundItem) {
        if (!err) {
          res.redirect("/" + listName);
        }
      }
    );
  }
});

app.get("/:ListName", function (req, res) {
  const listName = _.capitalize(req.params.ListName);
  List.findOne({ name: listName }, function (err, foundItems) {
    if (!err) {
      if (!foundItems) {
        const list = new List({
          name: listName,
          items: defaultList,
        });
        list.save();
        res.redirect("/" + listName);
      } else {
        res.render("toDoList", {
          listTitle: foundItems.name,
          listItems: foundItems.items,
        });
      }
    }
  });
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, function (req, res) {
  console.log("Server is successfully started");
});

// https://lets-organize.herokuapp.com/