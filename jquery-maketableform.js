//check the existence of Object.create function 
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

    //create an self invoking anynomous function 
   //pass an instance of jquery, window, document and undefined
 (function($, window, document , undefined ){
    //create a plugin object
     var makeRowForm = {
         init: function(options, element){
             //refers to the object instance 
             var self = this; 

             self.elem = element; 

             //current element as jq object
             self.$elem = $(element); 

             //overide default options 
             self.options = $.extend(  {}, $.fn.makeRowForm.options, options );


            //bind event listener for activating disabled submit button 
            if(self.options.parentElWatchSubmitBtnActivate !== null){
                $(self.options.parentElWatchSubmitBtnActivate).on('input', function(event){
                    $(self.options.submitOptions['button']).attr('disabled',false);
                }); 
             }
             
            //by default , table form input fields can reactivate submit button 
            self.$elem.on('input',function(event){
                $(self.options.submitOptions['button']).attr('disabled',false);
            });


            if(self.options.removeLastRowButton !== null){
                self.removeLastRow(element); 
            }

            if(self.options.submitOptions !== null){
                self.submitForm(); 
            }

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
         ajaxDelegate(url, data = null, mode = null){
             var self = this; 
             var toSend = null; 
             var csrfToken = self.options.useCsrfToken;
             var payload = null; 
            
             //both data and csrftoken 
             if(data !== null && csrfToken !== null){ 
                 data_obj = data; 
                if(typeof data != 'object'){
                    data_obj = {'payload':data};
                }
                payload = $.extend({},csrfToken, data_obj); 
             }
            
             //only data
             if(data !== null && csrfToken === null){
                payload = data;
             }

             //only csrftoken 
             if(data === null && csrfToken !== null){
                payload = csrfToken;
             } 

             switch(mode){
                 case "fetch": 
                    toSend = payload;
                 break; 
                 case "send":
                    toSend = payload;
                 break;
             }

             return  $.ajax({
                   url: url, 
                   method: 'post', 
                   data: toSend, 
                   dataType: 'json'
               });
         },  
         fetch: function(url, data) {
           var self = this; 
           return self.ajaxDelegate(url, data, "fetch");
         },
         send: function(url, data){
             var self = this; 
             return  self.ajaxDelegate(url, data, "send");
         }, 
         watch: function(){
             var self = this; 
         }, 
         styler:function(mode){
             //between bootstrap 
             //custom 
         },
         removeLastRow(element){
             var self = this;

             $(self.options.removeLastRowButton).on("click", function(e){
                 var all_trs = $(element).find("tr"); 
                 count_of_trs = all_trs.length; 

                 last_tr = all_trs.last(); 
                 
                 if(self.options.renderTheadElement !== null){
                     if(self.options.renderSummaryRow !== null){
                         //ignore summary_row
                         if(count_of_trs > 3){
                             last_tr.prev().remove();
                         }else{
                               alert("Removal not successful: there must be at least one form row to proceed."); 
                         }
                     }else{
                         if(count_of_trs > 2){
                             last_tr.remove();
                         }else{
                               alert("Removal not successful: there must be at least one form row to proceed."); 
                         }
                     }
                 }

                 self.bindRowCount(element); 
                 e.preventDefault(); 
             });  
         } , 
         computeColumns(bindingElement, operation = "add"){
             var self = this; 

             switch(operation){
                 case "add":     

                     $.each(self.options.computeColumns, function(key,column_object){
                          var fields_type = column_object.fields_type;
                          var column_name = column_object.column_name;
                          var mapTo       = column_object.mapTo; 
                          var columnSum   = 0; 

                          var pattern = `(${column_name})([_|-]?[\\d]+)`;
                          var regex = new RegExp(pattern,'g'); 

                          var similar_fields = $(bindingElement).find(fields_type);
                          var sumArr = null;  

                          similar_fields.each(function(){
                              if($(this).attr('name').match(regex)){
                                 var field_name = self.matchEventField($(this).attr('name'), true);
                                 columnSum += Number($(this).val());  
                                 console.log( $(this).attr('name') + "====" + $(this).val() );                                 
                              }
                          }); 
                          // $(`input[name=${mapTo}]`).val(columnSum); 
                     }); 
                 break; 
             }
         }, 
         render: function(element){
             //cache instance 
             var self = this;

             var tableStyleClass =  (self.options.useBootstrapTable) ? "table" : ""; 

             //bind table to formTableElement 
             element.prepend(`<form id="${self.options.renderedFormId}"><table id="${self.options.renderedTableId}" class="${tableStyleClass}"></table></form>`);

             if(self.options.renderTheadElement !== null){
                 var thead = `<tr>`; 
                 
                 $.each(self.options.renderTheadElement, function(key,value){
                     thead+=`<th>${value}</th>`; 
                 }); 

                 //end thead with tr 
                 thead+='</tr>'; 

                 $(element).find(`#${self.options.renderedTableId}`).append(thead); 
             }

             //cache table 
             var table = element.find(`#${self.options.renderedTableId}`); 

             //if there should not be duplication of first row 
             if(!self.options.duplicateFirstRow){
                 self.options.renderOrder = "userDefinedRowsOnly"; //render only user defined rows 
             }

             switch(self.options.duplicateTrigger){
                 case "counter": 
                     switch(self.options.renderOrder){
                         case "duplicateFirst": 
                             self.duplicateFirstRow(element, table); 
                             self.renderExplicitRows(element, table); 
                         break; 
                         case "explicitFirst": 
                     
                             self.renderExplicitRows(element, table); 
                             self.duplicateFirstRow(element, table); 
                             
                         break; 
                         case "duplicateOnly":
                             self.duplicateFirstRow(element, table);
                         break;
                         case "userDefinedRowsOnly":
                             self.renderExplicitRows(element, table); 
                         break;
                         default:
                             console.log(`Invalid duplicate order provided -> duplicateFirst, explicitFirst, duplicateOnly,userDefinedRowsOnly are the only available options`); 
                         break;
                     }
                 break; 
                 case "event": 
                     /*-----------------------------------------------------------------
                      * 
                      *-----------------------------------------------------------------
                      *  event duplicating method would be used here
                      *  when using eventing to duplicate only first row can be rendered 
                      *
                      *  register the event on the table 
                      *  attach it to the specified form control
                     -------------------------------------------------------------------*/
                     self.renderExplicitRows(element, table , 1, "event"); 
                    
                     $(`#${self.options.renderedTableId}`).on('keypress','.enterKeyListener', function(event){
                         if(event.key == self.options.bindTriggerEvent["keyAction"]){
                             self.renderExplicitRows(element, table , 1 , "event"); 
                         }
                     }); 
                 break; 
             }

         },
          countRows: function(bindingElement){
             var self = this; 

             var row_count = $(bindingElement).find("tr").length; 

             /*--------------------------------------------------
              *  Reducing table row count 
              *--------------------------------------------------
              * before removing th row from count check to ensure
              * it has been rendered 
              * same for summary row 
             ----------------------------------------------------*/

             var thExist = ( $(bindingElement).find("tr").children("th").length > 0 ) ? true : false; 

             if(self.options.renderTheadElement !== null && thExist ){
                 row_count = row_count - 1; 
             }

             var sumRowExist = ( $(bindingElement).find(`#${self.options.summaryRowId}`).length > 0 ) ? true : false; 

             if(self.options.renderSummaryRow !== null && sumRowExist){
                 row_count = row_count - 1; 
             }

             return row_count; 
          }
         , 
         duplicateFirstRow:function(bindingElement,table){
             var self = this; 
             var rowType  = "dynamic"; 

             var base_row = self.options.columnStructurePerRow[0]; 

             if( self.isAvaiable(self.options.duplicateCount, "duplicateCount") ){
                 var mirroredRowCounter = 1;

                 for(mirroredRowCounter; mirroredRowCounter <= self.options.duplicateCount; mirroredRowCounter++){
                     //bind tr
                     table.append(`<tr data-row-count="${mirroredRowCounter}"></tr>`);

                     //find last element 
                     var current_row = bindingElement.find("tr").last(); 
                        
                         self.buildRow(base_row, mirroredRowCounter,rowType, current_row); 
                 
                 }
             }

         }, 
         renderExplicitRows:function(bindingElement,table, delimiter = false, renderMode = ""){
                 var self = this; 
                 var name_affix = 0;
                 var skippedFirstRow    = false;
                 var rowType            = "explicit"; 

                 if(delimiter === 1) {

                     if(self.countRows(bindingElement) == 0){
                         table.append(`<tr data-row-count="1"></tr>`);
                     }else{
                         table.append(`<tr data-row-count="${self.countRows(bindingElement)+1}"></tr>`);
                     }
                    
                     var current_row = bindingElement.find("tr").last(); 
                        
                     if(renderMode !== "event"){
                         self.buildRow(self.options.columnStructurePerRow[0], name_affix,rowType, current_row); 
                     }

                     if(renderMode === "event"){
                         self.buildRow(self.options.columnStructurePerRow[0], self.countRows(bindingElement),rowType, current_row); 
                     }

                 }

                 //render using a duplicate counter 
                 if(delimiter !== 1){
                     $.each( self.options.columnStructurePerRow, function(key, rowObject){
                             //bind tr
                             table.append(`<tr data-row-count="${name_affix}"></tr>`);

                             //find last element 
                             var current_row = bindingElement.find("tr").last(); 
                                
                             self.buildRow(rowObject, name_affix,rowType, current_row); 
                      
                         name_affix++; 
                     });
                 }

         },
         testUndefine: function(value){
            return (value == undefined) ? "" : value.toLowerCase(); 
         },
         isAvaiable:function(value,errorLabel = ""){
             var flag = true; 

             if(value === undefined){
                 throw new Error(`${errorLabel} Option is undefined`); 
                 flag = false; 
             }

             if(value === null){
                 throw new Error(`${errorLabel} Option is null`); 
                 flag = false; 
             }

             return flag; 
         } , 
         makeReactive:function(current_row = null){
             var self      = this; 
             var elType    = self.options.makeReactive[0]["elType"];
             var dataKey   = self.options.makeReactive[0]["dataKey"];
             var listenOn  = self.options.makeReactive[0]["listenOn"];
             var eventName = self.options.makeReactive[0]["eventName"];
             var dependencyObj = self.options.makeReactive[0]["dependsOn"]; 

             // self.computeColumns(bindingElement); 

             var toMakeData = 0; 

             switch(elType){
                 case "select": 
                 //get the tr we are on 
                 var default_selected = $(`tr:eq(${current_row}) select`).children("option:selected"); 
                 var default_bindedOptionData = $(default_selected).data(dataKey); 
                 var default_optionValue =      $(default_selected).val(); 

                 //activate reactivity for the very first option as well 
                 self.delegateReactivity(dependencyObj,default_selected,default_bindedOptionData , default_optionValue);

                 //TODO: bind to the static form element instead 
                     $(`select[name=${listenOn}_${current_row}]`).on("change", function(event){
                         var selected   = $(this).children("option:selected");

                         var SelectedOptionBindedData = selected.data(dataKey);
                         var optionValue = selected.val();

                         self.delegateReactivity(dependencyObj,selected,SelectedOptionBindedData, optionValue);

                     }); //end of onchange event handler 
                 break;
                 default:

                 break; 
             }
 
         }, 
         delegateReactivity: function(dependencyObj,selected,SelectedOptionBindedData, optionValue){
             var self = this; 
             var toMake    = self.options.makeReactive[0]["toMake"];
             
             var multiplier = optionValue * 100; 
             //
             var expectedBrowserEvents  = ['input','onchange']; 

             $.each(dependencyObj, function(key, dependency){
              //find the closest input field 
              var elType = dependency["elType"]; 
              var column = dependency["column"]; 
              var operation = dependency["operation"]; 

              //sometimes the even value would not be a browser event
              //instead , an html attribute where data can be extracted 
              var event = dependency["watchFor"];
         

              var closest_tr = $( selected ).closest("tr");
              var row_number = $(closest_tr).data("rowCount"); 

              var requiredField = ""; 
               requiredField = requiredField+=column+"_"+row_number ; 
              

               if( expectedBrowserEvents.includes(event) ){
                switch(elType){
                    case "input": 
                        //the input needed to compute the value of the toMake field 
                        var requiredInputField = $(`input[name=${requiredField}]`);
  
                        //the field which would take the resulting reactive computation 
                        var setField = `input[name=${toMake}_${row_number}]`; 
  
                        var eventFieldValueBeforeChange  = ($(requiredInputField).val() === "") ? 0 : $(requiredInputField).val() ;
  
                        //TODO: fix duplication perhaps make this a function 
                        switch(operation){
                            case "multiply": 
                                var setValue = self.roundUp( SelectedOptionBindedData * ( eventFieldValueBeforeChange * multiplier) ) ;
                                $(setField).val( self.roundUp(setValue) ); 
                            break;   
                        }
  
                            requiredInputField.on("keydown", function(event){ 
                                if(event.keyCode === 8){
                                    //value from the field which generated the event
                                    var eventFieldValue = $(this).val(); 
                                    if(eventFieldValue === ""){
                                        eventFieldValue = 0; 
                                    }
                                    $(setField).val(eventFieldValue); 
  
                                    //self.computeColumns(bindingElement); 
                                }
                            }); 
  
                            //when the binded event to the field is evoked 
                            requiredInputField.on(event, function(event){
                     
                            //self.computeColumns(bindingElement); 
  
                          //value from the field which generated the event
                          var eventFieldValue = $(this).val();
  
                            switch(operation){
                                case "multiply": 
                                    var setValue = self.roundUp(SelectedOptionBindedData * ( eventFieldValue * multiplier)) ;
                                    $(setField).val(setValue); 
                                break;   
                            }
                        }); //end of dependency event 
                    break; 
                }   
               }else{
                   //the current depency object is not based on events but 
                   //an html attribute where data can be extracted;
               }
     
             }); //end of dependency iteration 
         },
         roundUp: function(num,to = 2) {    
               var multiplier = Math.pow(10, to);
               return (Math.round(num * multiplier) / multiplier);
        },
         matchEventField: function(input,returnInput = false){
             var self = this; 
             //strip name affix before comparison 
             
             //TODO: fix regex to support other name formats
           
             if(/(.+)([_|-][\d]+)/.test(input)){
                 //TODO: rewrite this code to make it more effecient 
                 var countOfUnderscores = (input.match(/_/g) || []).length; 
          
                 if(countOfUnderscores === 1){
                     var index = countOfUnderscores - 1 ;  
                     input = input.split("_")[index];  //extract the column name without the affix
                 }else{
                     var temp = ""; 
                     for(i = 0; i < countOfUnderscores; i++){
                         temp+=input.split("_")[i]; 
                         if(i !== countOfUnderscores - 1){
                             temp+="_"; 
                         }
                     }
                     input = temp;
                 }
             }

             //if the resulting event field is the same as what was defined 
             //in the row definition by the user 
             if(!returnInput){
                 return (input === self.options.bindTriggerEvent["input_name"]) ? true : false; 
             }

             if(returnInput){
                 return input;
             }
         }, 
         submitForm(endpoint){
             var self = this; 
             var exportData = {};
             var ajaxLoader = self.options.ajaxProcessingLoader; 
             var formId = self.options.renderedFormId

             $(`${self.options.submitOptions["button"]}`).on("click", function(e){
              
                 exportData = $(`#${self.options.renderedFormId}`).serializeArray();

                 if(ajaxLoader["loaderId"] != null){
                    $(ajaxLoader["loaderId"]).fadeIn(ajaxLoader["fadeIn"]);
                 }
                
                 //disable on submit to prevent multiple submissions 
                 if(self.options.submitOptions["canDisable"] === true){
                     $(this).attr('disabled','disabled');
                 }

                 exportData = self.reduceSerializedForm(exportData);  

                 if(self.options.serializeOtherFields !== null){
                     var morePayload = {}; 
                     $.each(self.options.serializeOtherFields , function(key, field_object){
                         var field_name = field_object["field_name"];
                         var field_type = field_object["type"];
                         var data = null; 

                         switch(field_type){
                             case "input":
                                 data = $(`input[name=${field_name}]`).val();
                             break; 
                             case "select":
                                data = $(`select[name=${field_name}`).find(`option:selected`).val();
                             break;
                             case "textarea":
                                data = $(`textarea[name=${field_name}`).val();
                             break;
                         }
                         
                         morePayload[field_name] = data;
                     }); 
                 }

                 //bind other serializeable field data
                 exportData = $.extend({},exportData, morePayload); 

                 self.send(self.options.submitOptions["url"], exportData).always(function(response){
                    if( $.isFunction( self.options.onSubmitDone )){
                        self.options.onSubmitDone.call(this, response); 
                    }
                 });
                 e.preventDefault(); 
             });
         },
        reduceSerializedForm(formData){
            var newData = {};

            $.each(formData, function(key, object){
                newData[object.name] = object.value; 
            }); 

            return newData; 
        }, 
         buildSummary(element){
             var self = this;
             var summaryRowId = self.options.summaryRowId;
             var summary_row_template = `<tr id='${summaryRowId}'></tr>`; 
             var formControlStyle =  (self.options.useBootstrapForm) ? "form-control" : ""; 

             //find previous last row 
            var last_row = $(element).find("tr").last(); 
            
            //inser summary row after the last row 
            last_row.after(summary_row_template); 
             
             $.each(self.options.renderSummaryRow, function(key, tdObject){
                 if(tdObject.length != 0){
                     var field_type  = self.testUndefine(tdObject[0].type);
                     var field_name  = self.testUndefine(tdObject[0].name);
                     var field_value = self.testUndefine(tdObject[0].value);
                     var cssClass    = self.testUndefine(tdObject[0].class);
                     var readonly    = self.testUndefine(tdObject[0].readonly);

                     //prepare table data
                     var input_template = `<td><${field_type} class="${formControlStyle} ${cssClass}" name="${field_name}" value="${field_value}" ${readonly}/></td>`; 
                     
                     if(field_type === "lable"){
                         var input_template = `<td id='${self.testUndefine(tdObject[0].id)}'>${ self.testUndefine(tdObject[0].content) }</td>`; 
                     }

                     //append table data 
                     $(`#${summaryRowId}`).append(input_template); 
                 }else{
                     var input_template = `<td></td>`; 

                     $(`#${summaryRowId}`).append(input_template); 
                 } 
             }); 
         }, 
         bindRowCount:function(bindingElement = null){
            var self = this; 

            if(self.options.rowCountOptions !== null){
                var count = self.countRows(bindingElement); 
                var field_name = self.options.rowCountOptions["field_name"]; 

                $(`input[name=${field_name}]`).val(count); 
            }
          },
         buildRow: function(rowStructure, name_affix = null,rowType = null, current_row){
             var self = this; //cache this

             //before building new row check for the existence of last row 
             //and remove it 
             if(self.options.renderSummaryRow !== null){
                 var summaryRow = $(bindingElement).find(`#${self.options.summaryRowId}`);
                 if( summaryRow.length > 0){
                     summaryRow.remove(); 
                 }; 
             }

             var formControlStyle =  (self.options.useBootstrapForm) ? "form-control" : ""; 

             $.each(rowStructure, function(index, tdObject){
                
                 if(! $.isEmptyObject(tdObject) ){
                     var field_type  = self.testUndefine(tdObject[0].type);
                     var field_name  = self.testUndefine(tdObject[0].name);
                     var field_value = self.testUndefine(tdObject[0].value);
                     var cssClass    = self.testUndefine(tdObject[0].class);
                     var attributes    = self.testUndefine(tdObject[0].attributes);

                     if(name_affix > 0 && rowType === "dynamic"){
                          field_name += `_${name_affix}`;  
                     }

                     if(name_affix > 0 && rowType === "explicit"){
                          field_name += `_${name_affix}`;  
                     }

                     //bind event listener to the specific input 
                     //to generate next row 
                     if(self.matchEventField(field_name)){
                         input_template = `<td><${field_type} class="${formControlStyle} ${cssClass} enterKeyListener" name="${field_name}" value="${field_value}" ${attributes}/></td>`; 
                     }else{
                         input_template = `<td><${field_type} class="${formControlStyle} ${cssClass}" name="${field_name}" value="${field_value}" ${attributes}/></td>`; 
                     }

                     //create table data with form field
                     switch(field_type) {
                         case "input": 
                             $(current_row).append(input_template);
                         break;

                         case "select": 
                             $(current_row).append(`<td><${field_type} class="${formControlStyle} ${cssClass}" name="${field_name}" /></td>`);
                             
                             var select_element = $(current_row).find("select").last(); 

                             if(typeof tdObject[0].options === 'object') {
                                 if(tdObject[0].options["dataSource"] === undefined){
                                     $.each(tdObject[0].options, function(key, option) {
                                         $(select_element).append(`<option value="${option}">${key}</option>`); 
                                     }); 
                                 }else{
                                     //this block would handle getting data from external source 
                                     var options = tdObject[0].options; 
                                     
                                     if(options["dataSource"] === "external"){
                                      
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

                                                //name given to the data-item attached to the option 
                                                var dataKey = self.options.bindAddedData["dataKey"];

                                                //cached name for the assigned option object
                                                var dataFormatter = self.options.externalSelectFieldDataFormat; 
                                               
                                                var valueKey = null; 
                                                var displayNameKey = null; 

                                                //for additionalBindedData 
                                                var retrievedDataIndex = self.options.bindAddedData["retrievedDataIndex"];

                                                //for select
                                                valueKey = dataFormatter['optionValueKeyFromExternalData']; 
                                                displayNameKey = dataFormatter['optionDisplayNameKeyFromExternalData'];
                                                
                                                 
                                                $.each(results, function(key,response){


                                                     //handles binding additional data to <option> tags 
                                                    if( typeof(response) === 'object' && self.options.bindAddedData !== null){
                                                         var bindedVal = response[retrievedDataIndex]; 
                                                         var optionVal = response[valueKey]; 
                                                         var displayName = response[displayNameKey]; 

                                                         $(select_element).append(`<option data-${dataKey}=${bindedVal} value="${optionVal}">${displayName}</option>`); 
                                                       
                                                     }
                                                     
                                                     //add support for rendering when there is no need to bind additional data 
                                                     
                                                    //handles a simple json is return ex. {age:2, name:kofi}
                                                    //  $(select_element).append(`<option value="${key}">${response}</option>`); 

                                                  
                                                 }); 
                                             }); 
                                         }
                                     } //end of source option check                          
                                 } //end of if check 
                             } //end of typeof check 
                         break;
                             
                     }
                 }
             }); //end of .each loop 

             if(self.options.rowRenderLog){
                 console.log("row built successfully");
             }

             if(self.options.focusNewRow){
                 $(rowStructure[0][0]["type"]).last().focus().select(); 
             }

             if(self.options.makeReactive !== null){  
                 var elType    = self.options.makeReactive[0]["elType"];
                 
                 var row_count = $(bindingElement).find("tr").length; 

                 /*--------------------------------------------------
                  *  Reducing table row count 
                  *--------------------------------------------------
                  * before removing th row from count check to ensure
                  * it has been rendered 
                  * same for summary row 
                 ----------------------------------------------------*/

                 var thExist = ( $(bindingElement).find("tr").children("th").length > 0 ) ? true : false; 

                 if(self.options.renderTheadElement !== null && thExist ){
                     row_count = row_count - 1; 
                 }

                 var sumRowExist = ( $(bindingElement).find(`#${self.options.summaryRowId}`).length > 0 ) ? true : false; 

                 if(self.options.renderSummaryRow !== null && sumRowExist){
                     row_count = row_count - 1; 
                 }
                
                 //switch the kind of element that needs reactivity monitored on
                 switch(elType){
                     case "select":
                        
                         /*--------------------------------------------------------
                          * Binding Reactivity to ListenOn field 
                          *--------------------------------------------------------
                          * watch for changes in the dom 
                          * for every new node insertion 
                          * search for select 
                          * reactivity would be called only after 
                          * there is at least one option inserted
                         ----------------------------------------------------------*/
                         var listenOn = "select[name="+self.options.makeReactive[0]['listenOn']+"_"+row_count+"]";
                         var mutationObserver = new MutationObserver(function(mutations) {
                             if( $(`${listenOn} option`).length > 0 ){
                                  mutationObserver.disconnect(); 
                                
                                  self.makeReactive(row_count);
                             }
                         }); 

                         // Starts listening for changes in the root HTML element of the page.
                         mutationObserver.observe(document.documentElement,{childList: true, subtree:true}); 
                     break;
                     default:
                         console.log("Reactivity has not been binded to this type of element");
                     break;
                 }//end of switch for determining form control 
             }//end of reactive declaration 

             if(self.options.renderSummaryRow !== null){
                 self.buildSummary(bindingElement); 
             }

             if(self.options.computeColumns !== null){
                 //self.computeColumns(bindingElement);
             }

             self.bindRowCount(bindingElement); 
         }
     }; //end of buildRow function 

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

     //TODO: make plugin render default 
     $.fn.makeRowForm.options = {
         duplicateFirstRow: false,
         useCsrfToken:false, //pass a csry token object to make this value true
         duplicateTrigger: "counter", //determines whether mirror should be based on a number or event 
         duplicateCount:null,
         renderOrder:"userDefinedRowsOnly",
         renderTheadElement:null,  //an array of column names 
         renderSummaryRow:null, 
         makeReactive:null, 
         parentElWatchSubmitBtnActivate:null, //this element would watch sub elements for reactivating disabled submit button 
         onSubmitDone:null, //callback function 
         renderedTableId:"rowFormTable", //name of the table that the plugin generates 
         renderedFormId:"rowForm", //name of the form generated by the plugin . 
         summaryRowId:"summary_row", //name of the summmary row the plugin generates 
         useBootstrapTable:false, //adds boostraps table class to tables 
         useBootstrapForm:false,  //adds boostraps form control class 
         rowRenderLog:false, //logs success message to console when row builds
         focusNewRow: true, //focuses first input field in the newly inserted row 
         activateSelectSearch:true, 
         roundUpTo: 2, //roundup calculation to 2 decimal places 
         bindAddedData:null, // bind additional data to select fields 
         columnStructurePerRow : [
             [   
                 [{"type":"input", "name":"username","value":"six hundred"}],
                 [{"type":"select", "name":"hobbies" , "options": {"dataSource":"external", "url" : "hobbies.php", "data": "hobbies", "cache_data": true} }]
             ] , 
             [   
                 [{"type":"password", "name":"password","value":"John Doe"}],
                 [{"type":"select", "name":"hobbies" , "options": {"dataSource":"external", "url" : "hobbies.php", "data": "hobbies", "cache_data": true} }]
             ]
         ], 
         externalSelectFieldDataFormat: {'optionValueKeyFromExternalData':'id','optionDisplayNameKeyFromExternalData':'name'},
         ajaxProcessingLoader: {"loaderId":null, "fadeIn":250, "fadeOut":1000}
        
     };
     
 })(jQuery, window, document);/*end of siaf*/