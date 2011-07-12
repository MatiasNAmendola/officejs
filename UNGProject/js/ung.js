/**
 * This file provides the javascript used to display the list of user's documents
 */

/* global variable */
    /* the last modified document */
getCurrentDocumentID = function() {return localStorage.getItem("currentDocumentID");}
setCurrentDocumentID = function(ID) {return localStorage.setItem("currentDocumentID",ID);}

/**
 * class DocumentList
 * This class provides methods to manipulate the list of documents of the current user
 * As the list is stored in the localStorage, we are obliged to call "setDocumentList" after
 * any content modification
 * @param arg : a documentList json object to load
 */
var DocumentList = function(arg) {
    //List.call(this);
    if(arg) {
        this.load(arg);
        this.load(new List(arg,JSONDocument));
        this.selectionList = new List(arg.selectionList,JSONDocument);//load methods of selectionList
    }
    else {
        this.displayedPage = 1;
        this.selectionList = new List();
    }
}
DocumentList.prototype = new List();
DocumentList.prototype.load({
    addDocument: function(doc) {
        this.add(doc);
        setDocumentList(this);
        this.display();
    },
    removeDocument: function(doc) {
        var i = this.find(doc);
        this.get(i).remove()//delete the file
        this.remove(i);//remove from the list
        setDocumentList(this);
        this.display();
    },

    getSelectionList: function() { return this.selectionList; },
    resetSelectionList: function() {
        this.selectionList = new List();
        for(var i=0; i<this.size(); i++) {
            $("tr td.listbox-table-select-cell input#"+i).attr("checked",false);//uncheck
        }
        setDocumentList(this);
        $("span#selected_row_number a").html(0);//display the selected row number
    },
    checkAll: function() {
        this.selectionList = new List();
        for(var i=0; i<this.size(); i++) {
            this.getSelectionList().add(this.get(i));
            $("tr td.listbox-table-select-cell input#"+i).attr("checked",true);
        }
        setDocumentList(this);
        $("span#selected_row_number a").html(this.size());//display the selected row number
    },

    deleteSelectedDocuments: function() {
        var selection = this.getSelectionList();
        while(!selection.isEmpty()) {
            var doc = selection.pop();
            this.removeDocument(doc);
        }
    },

    getDisplayedPage: function() {return this.displayedPage;},
    setDisplayedPage: function(index) {this.displayedPage = index;},

    /* display the list of documents in the web page */
    displayContent: function() {
        $("table.listbox tbody").html("");//empty the previous displayed list
        var n = this.size();
        for(var i=0;i<n;i++) {
            var ligne = new Line(this.get(i),i);
            ligne.updateHTML();
            ligne.display();
        }
    },
    displayListInformation: function() {
        if(this.size()>0) {
            $("div.listbox-number-of-records").css("display","inline");
            var step = getCurrentUser().getDisplayPreferences();
            var first = (this.getDisplayedPage()-1)*step + 1;
            var last = (this.size()<first+step) ? this.size() : first+step-1;
            $("span#page_start_number").html(first);
            $("span#page_stop_number").html(last);
            $("span#total_row_number a").html(this.size());
            $("span#selected_row_number a").html(this.getSelectionList().size());
        }
        else {$("div.listbox-number-of-records").css("display","none");}
    },
    display: function() {
        this.displayContent();
        this.displayListInformation();
    },

    /* update the ith document information */
    update: function(i) {
        var list = this;
        var doc = list.get(i);
        loadFile(getDocumentAddress(doc),"json",function(data) {
            doc.load(data);//todo : replace by data.header
            doc.setContent("");//
            list.set(i,doc);
            setDocumentList(list);
        });
    }
});
getDocumentList = function() {
    return new DocumentList(JSON.parse(localStorage.getItem("documentList")));
}
setDocumentList = function(list) {
    localStorage.setItem("documentList",JSON.stringify(list));
}


/**
 * create a line representing a document in the main table
 * @param doc : document to represent
 * @param i : ID of the line (number)
 */
var Line = function(doc, i) {
    this.document = doc;
    this.ID = i;
    this.html = Line.getOriginalHTML();
}
Line.prototype = {
    getDocument: function() {return this.document;},
    getID: function() {return this.ID;},
    getType: function() {return this.document.getType() ? this.document.getType() : "other";},
    getHTML: function() {return this.html;},
    setHTML: function(newHTML) {this.html = newHTML;},
    isSelected: function() {
        return $("tr td.listbox-table-select-cell input#"+this.getID()).attr("checked");
    },

    /* add the document of this line to the list of selected documents */
    addToSelection: function() {
        var list = getDocumentList();
        list.getSelectionList().add(this.getDocument());
        setDocumentList(list);
    },
    /* remove the document of this line from the list of selected documents */
    removeFromSelection: function() {
        var list = getDocumentList();
        list.getSelectionList().removeElement(this.getDocument());
        setDocumentList(list);
    },
    /* check or uncheck the line */
    changeState: function() {
        this.isSelected() ? this.addToSelection() : this.removeFromSelection();
        $("span#selected_row_number a").html(getDocumentList().getSelectionList().size());//display the selected row number
    },

    /* load the document information in the html of a default line */
    updateHTML: function() {
        var line = this;
        this.setHTML($(this.getHTML()).attr("class",this.getType())
            .find("td.listbox-table-select-cell input")
                .attr("id",this.getID())//ID
                .click(function() {line.changeState();})//clic on a checkbox
            .end()
            .find("td.listbox-table-data-cell")
                .click(function() {//clic on a line
                    setCurrentDocumentID(line.getID());
                    startDocumentEdition(line.getDocument())
                })
                .find("a.listbox-document-icon")
                    .find("img")
                        .attr("src",supportedDocuments[this.getType()].icon)//icon
                    .end()
                .end()
                .find("a.listbox-document-title").html(this.getDocument().getTitle()).end()
                .find("a.listbox-document-state").html(this.getDocument().getState()[getCurrentUser().getLanguage()]).end()
                .find("a.listbox-document-date").html(this.getDocument().getLastModification()).end()
            .end());
    },
    /* add the line in the table */
    display: function() {$("table.listbox tbody").append($(this.getHTML()));}
}
/* load the html code of a default line */
Line.loadHTML = function() {
    loadFile("xml/xmlElements.xml", "html", function(data) {Line.originalHTML = $(data).find("line table tbody").html();});
    return Line.originalHTML;
}
/* return the html code of a default line */
Line.getOriginalHTML = function() {return Line.originalHTML;}


 /**
  * create a new document and start an editor to edit it
  * @param type : the type of the document to create
  */
var createNewDocument = function(type) {
    var newDocument = new JSONDocument();
    newDocument.setType(type);

    newDocument.save(function() {
        getDocumentList().addDocument(newDocument);
        startDocumentEdition(newDocument);
    });
}