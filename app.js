import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import has from 'lodash';
import 'dotenv/config';
mongoose.set("strictQuery", false);


//Initialising neww app instance of express.
const app = express();


//Initailising, view engine, body-parser and static
//BodyParser -- For user input read
//ExpressStatic -- For static files access from public -- using express.static
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static("public"));




//Connecting mongoose ODM to mongoDB LOCAL database.
//mongoose.connect("mongodb://localhost:27017/todolistDB", {
//    useNewUrlParser: true
//});

//Connecting mongoose ODM to mongoDB SERVER based database.
const password = process.env.PASSWORD;
mongoose.connect(`mongodb+srv://devesh-admin:${password}@cluster0.yjqirxx.mongodb.net/todolistDB`, {
    useNewUrlParser: true
});


//Creating the ItemsSchema.
const itemsSchema = {
    name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name: "Welcome to your todolist!"
});

const item2 = new Item({
    name: "Hit the + button to add a new title!"
});

const item3 = new Item({
    name: "<--- Hit this to delete the item!"
});

const defaultItems = [item1, item2, item3];


//Creating and listSchema
const listSchema = {
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);



//Inserting the default items into the Item schema.
Item.insertMany(defaultItems, function (err) {
    if (err) {
        console.error(err);
    } else {
        console.log("Successfully inserted the items!");

    }
});



//Routing the home page.
app.get("/", function (req, res) {

    Item.find({}, function (err, foundItems) {
        console.log("FoundItems", foundItems.length);

        if (foundItems.length === 0) {
            Item.insertMany(defaultItems, function (err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("Successfully saved default items to DB!")
                }
            });
            res.redirect("/");
        } else {
            res.render('list', {
                listTitle: "Today",
                newListItem: foundItems
            });
        }
    });

})



//Routing the customlistname page.
//User can create their own list name by adding required extension in the url. 
app.get("/:customListName", function (req, res) {
    const customListName = has.capitalize(req.params.customListName);

    List.findOne({
        name: customListName
    }, function (err, foundList) {
        if (!err) {
            if (!foundList) {
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                list.save();
                res.redirect("/" + customListName);
            } else {
                res.render('list', {
                    listTitle: foundList.name,
                    newListItem: foundList.items
                });
            }
        }
    });
});




//Post method--to add new list items. 
app.post("/", function (req, res) {

    const itemName = req.body.newItem;
    const listName = req.body.list;
    console.log("ListName While adding", listName);

    const item = new Item({
        name: itemName,
    });

    if (listName === 'Today') {
        item.save();
        res.redirect('/');
    } else {
        List.findOne({
            name: listName
        }, function (err, foundList) {
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        })
    }
})


//Post method--to delete new list items. 
app.post("/delete", function (req, res) {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;
    console.log("listName", listName);


    if (listName === "Today") {
        Item.findByIdAndRemove(checkedItemId, function (err) {
            if (err) {
                console.log(err);
            } else {
                res.redirect("/");
            }
        });
    } else {
        List.findOneAndUpdate({
            name: listName
        }, {
            $pull: {
                items: {
                    _id: checkedItemId
                }
            }
        }, function (err, foundList) {
            if (!err) {
                res.redirect('/' + listName);
            }
        })
    }
});



app.listen(3000, function () {
    console.log("Server started on port 3000");
})
