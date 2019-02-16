   if ( typeof Object.create !== 'function'){
       Object.create = function( obj ) {
           //create a named function object 
           function F(){}; 

           //replace F prototype with obj  
           F.prototype = obj;

           //return a new instance of F() 
           return new F();  
       };
   }

    (function($, window, document , undefined ){

        var makeRowForm = {
            init: function(options, element){
                //refers to the object instance 
                var self = this; 

                self.elem = element; 

                //current element as jq object
                self.$elem = $(element); 

                //overide default options 
                self.options = $.extend(  {}, $.fn.makeRowForm.options, options )

                self.render( self.$elem ); 
            },
            extractAjaxData: function(url,item){
                    switch(item){
                      case "data": 
                         data_part = url.split("?")[1];
                            return data_part.split("=");
                      break; 
                      case "url": 
                            return url.split("?")[0];
                      break;
                  }
            },  
            fetch: function(url, data) {
              var self = this; 

              return  $.ajax({
                    url: url, 
                    method: 'post', 
                    data: { data_key : data}, 
                    dataType: 'json'
                });
            }, 
            watch: function(){
                var self = this; 
            }, 
            styler:function(mode){
                //between bootstrap 
                //custom 
            }, 
            render: function(element){
                //cache instance 
                var self = this;

               
                var tableStyleClass =  (self.options.useBootstrapTable) ? "table" : ""; 

                //bind table to formTableElement 
                element.prepend(`<table class="${tableStyleClass}"></table>`);

                //cache table 
                var table = element.find("table"); 

                var good_to_go = (self.options.duplicateMethod == "explicit" && self.options.duplicateFirstRow) 
                                ? true 
                                : false; 

                if(good_to_go){
                    switch(self.options.renderOrder){
                        case "duplicateFirst": 
                            self.duplicateFirstRow(element, table); 
                            self.renderExplicitRows(element, table, "dual"); 
                        break; 
                        case "explicitFirst": 
                            self.renderExplicitRows(element, table, "dual"); 
                            self.duplicateFirstRow(element, table); 
                        break; 
                    }
                }
            },
            duplicateFirstRow:function(bindingElement,table,mode = null){
                var self = this; 
                var rowType  = "dynamic"; 

                var base_row = self.options.columnStructurePerRow[0]; 
                var mirroredRowCounter = 0;

                do{
                    //bind tr
                    table.append(`<tr></tr>`);

                    //find last element 
                    var current_row = bindingElement.find("tr").last(); 
                       
                        self.buildRow(base_row, mirroredRowCounter,rowType, current_row); 

                        mirroredRowCounter++; 
                }while(mirroredRowCounter <= self.options.duplicateCount);
            }, 
            renderExplicitRows:function(bindingElement,table, mode = null){
                    var self = this; 
                    var mirroredRowCounter = 0;
                    var skippedFirstRow    = false;
                    var rowType            = "explicit"; 

                    $.each( self.options.columnStructurePerRow, function(key, rowObject){
                        
                        if(skippedFirstRow){
                            //bind tr
                            table.append(`<tr></tr>`);

                            //find last element 
                            var current_row = bindingElement.find("tr").last(); 
                               
                                self.buildRow(rowObject, mirroredRowCounter,rowType, current_row); 
                        }else{skippedFirstRow = true}
                       
                        mirroredRowCounter++; 
                    });
            },
            testUndefine: function(value){
               return (value == undefined) ? "" : value.toLowerCase(); 
            }, 
            buildRow: function(rowStructure, rowCount,rowType = null, current_row){
                var self = this; 

                var formControlStyle =  (self.options.useBootstrapForm) ? "form-control" : ""; 

                $.each(rowStructure, function(index, tdObject){
                   
                    if(! $.isEmptyObject(tdObject) ){
                        var field_type  = self.testUndefine(tdObject[0].type);
                        var field_name  = self.testUndefine(tdObject[0].name);
                        var field_value = self.testUndefine(tdObject[0].value);

                        if(rowCount > 0 && rowType === "dynamic"){
                             field_name += `-${rowCount}`;  
                        }

                        //create table data with form field
                        switch(field_type) {
                            case "input": 
                                $(current_row).append(`<td><${field_type} class="${formControlStyle}" name="${field_name}" value="${field_value}" /></td>`);
                            break;

                            case "select": 
                                $(current_row).append(`<td><${field_type} class="${formControlStyle}" name="${field_name}" /></td>`);
                                
                                var select_element = $(current_row).find("select").last(); 

                                if(typeof tdObject[0].options === 'object') {
                                    if(tdObject[0].options["source"] === undefined){
                                        $.each(tdObject[0].options, function(key, option) {
                                            $(select_element).append(`<option value="${option}">${key}</option>`); 
                                        }); 
                                    }else{
                                        //this block would handle getting data from external source 
                                        var options = tdObject[0].options; 
                                        
                                        if(options["source"] === "external"){

                                         
                                            var good_to_go = false; 

                                            if(options["url"] !== undefined){
                                                var url = options["url"];
                                                good_to_go = true;
                                            }

                                            if(good_to_go){
                                                var data = options["data"];
                                            }

                                            if(good_to_go){
                                                //check if result is already cached 
                                                
                                                //get option data from external source 
                                                self.fetch(url, data).done(function(results){
                                                    $.each(results, function(key,option){
                                                       $(select_element).append(`<option value="${option}">${key}</option>`);  
                                                    }); 
                                                }); 
                                            }
                                        } //end of source option check                          
                                    } //end of if check 
                                } //end of typeof check 
                            break;
                                
                        }
                    }
                });
            }
        }; 

        $.fn.makeRowForm = function(options){
            //this is useful when alot of elements are matched by the selector
            if(this.length  > 1){
                return this.each(function(){
                    currentElement  = this; 
                    var formRowObject = Object.create(makeRowForm);
                    formRowObject.init( options, currentElement ); 
                });
            }

            //if there is only one matched element
            bindingElement  = this; 
            var formRowObject = Object.create(makeRowForm);
            formRowObject.init( options, bindingElement ); 
        }; 

        $.fn.makeRowForm.options = {
            duplicateFirstRow: false,
            duplicateMethod: null, //determines whether mirror should be based on a number or event 
            duplicateCount:null,
            renderOrder:null,  
            mirrorAction:null, 
            dynamicRows:false,  
            useBootstrapTable:false, 
            useBootstrapForm:false,  
            columnStructurePerRow : [
                [   
                    [{"type":"input", "name":"username","value":"six hundred"}],
                    [{"type":"select", "name":"hobbies" , "options": {"source":"external", "url" : "hobbies.php", "data": "hobbies", "cache_data": true} }],
                    [{"type":"select", "name":"cgames" , "options": {"source":"external", "url" : "rest.php", "data": "cgames", "cache_data": true} }],
                    [{"type":"select", "name":"mingames" , "options": {"source":"external", "url" : "rest.php", "data": "mingames", "cache_data": true} }],
                    [{"type":"input", "name":"age","value":""}],
                ] , 
                [   
                    [{"type":"select", "name":"social" , "options": {"source":"external", "url" : "rest.php", "data": "mingames", "cache_data": true} }],
                    [{"type":"input", "name":"age","value":""}],
                ], 
                [   
                    [{"type":"select", "name":"camp" , "options": {"source":"external", "url" : "rest.php", "data": "mingames", "cache_data": true} }],
                    [{"type":"input", "name":"age","value":""}],
                ]
            ]
        };
        
    })(jQuery, window, document);/*end of siaf*/