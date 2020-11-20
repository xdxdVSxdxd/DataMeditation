// where is your API? configure for your server
var APIBaseUrl = "https://he-r.it/DataMeditation/API/index.php";

// what is the group ID on yout database for which you want to generare the visualization?
var groupid = 4;

var theData = null;

var ritualDefinition = null;

var colorschemes = null;

var userids = null;

$(document).ready(function () {

	$.getJSON(APIBaseUrl + "?cmd=savedata&groupid=" +  groupid + "?v=" + Math.random()*Math.random() ,function(data){

		theData = data;

		//console.log(theData);

		prepareData();

	});
	
	
});


function prepareData(){
	var keystotal = new Array();
	var useridstotal = new Array();
	theData.theData.forEach(function(d){
		
		var jd = JSON.parse( d.jsonstring );

		d.theDateTime = luxon.DateTime.fromFormat(d.timestamp ,  "yyyy-MM-dd HH:mm:ss");
		
		useridstotal.push( d.userid );

		var keys = Object.keys(jd);

		keystotal = d3.merge([keystotal,keys]);

		d.jsondata = jd;
		d.jsonstring = null;
		
	});
	theData.dataKeys = d3.set( keystotal ).values();
	userids = d3.set( useridstotal ).values();
	theData.theData.forEach(function(d){
		theData.dataKeys.forEach(function(e){
			if(typeof d.jsondata[e] == 'undefined'  || d.jsondata[e]==null || d.jsondata[e]=="no answer"){
				d.jsondata[e] = "";
			}
		});
	});
	$("#outputdata").val(JSON.stringify(theData));
	console.log(theData);


	$.getJSON( "data/ritual.json?v=" + Math.random()*Math.random() ,function(data){
		ritualDefinition = data;
		console.log(ritualDefinition);
		setupViz();
	});
}


var totalwidth = 0;
var totalheight = 0;

var mindate = null;
var maxdate = null;




// ********************
// configure here the dimensions of the visualization
// with this configuration it comes out quite large
// you would need a large plotter and 2 meters of paper
// ********************
var margin = 200;
var labeldatesize = 500;
var axissize = 150;
var labelfieldsize = 950;
var labeltextsize = 4500;

var numberofhours = 0;
var rowheight = 220;



function setupViz(){
	totalwidth = margin + labeldatesize + axissize + margin;
	colorschemes = new Object();
	ritualDefinition.datatocollect.forEach(function(d){
		if(d.type=="switch" || d.type=="select"){

			var fieldid = d.fieldid;
			var domaini = new Array();
			d.positions.forEach(function(e){
				domaini.push(e[0]);
			});
			colorschemes[fieldid] = d3.scaleOrdinal().domain(domaini).range( d3.schemeAccent );
		}

		if(d.type=="text"){
			totalwidth = totalwidth + labeltextsize + margin;
		} else {
			totalwidth = totalwidth + labelfieldsize + margin;
		}

	});
	
	theData.theData.forEach(function(d){
		if(mindate==null){
			mindate = d.theDateTime;
		}
		if(maxdate==null){
			maxdate = d.theDateTime;
		}
		if(mindate.valueOf()>d.theDateTime.valueOf()){
			mindate = d.theDateTime;
		}
		if(maxdate.valueOf()<d.theDateTime.valueOf()){
			maxdate = d.theDateTime;
		}
	});

	var diff = maxdate.valueOf() - mindate.valueOf();
	numberofhours = Math.ceil( diff / 1000 / 60 / 60 );
	// console.log( mindate.toString() );
	// console.log( maxdate.toString() );
	// console.log( numberofhours );

	totalheight = margin + numberofhours * rowheight + margin;

	

	drawVViz();
	prepareLegend();
}

function prepareLegend(){


	d3.select("#legend").style("width",    d3.select("#vizholder svg").style("width")   );

	d3.select("#legend").append("h1").text("How to read this visualization");

	var legendHolder = d3.select("#legend").append("div").attr("id","legendholder");

	ritualDefinition.datatocollect.forEach(function(d){
		if(d.type=="switch" || d.type=="select"){

			var fieldid = d.fieldid;
			var fieldlabel = d.label;

			var la = legendHolder.append("div")
				.attr("class","legendarea");

			la.append("div")
				.attr("class","legenheader")
				.text(fieldlabel);

			

			d.positions.forEach(function(e){

				var litemcontainer = la.append("div")
									.attr("class","litemcontainer");

				litemcontainer.append("div")
							.attr("class","licolor")
							.style("background",colorschemes[fieldid](e[0]));
				litemcontainer.append("div")
							.attr("class","lilabel")
							.text(e[0]);

			});

		}
	});

	// to generate only the legend, uncomment below
	//d3.select("#vizholder svg").style("display","none"); 

}


var svg = null;
var gtot = null;

var previoushour = null;
var thishour = null;

var userslice = 1;

function drawVViz(){
	svg = d3.select("#vizholder").append("svg").attr("width" , totalwidth + 2*margin).attr("height",totalheight + 2*margin );
	gtot = svg.append("g").attr("transform", "translate(" + margin + ", " + margin + " )");


	var startxforheaders = margin + labeldatesize + axissize + margin;
	ritualDefinition.datatocollect.forEach(function(e){

		if(e.type!="text"){

			gtot.append("text")
				.attr("class","headers")
				.attr("x" , startxforheaders )
				.attr("y" , 0)
				.text(  e.label.toUpperCase()  );
			startxforheaders = startxforheaders + labelfieldsize;

		} else {

			gtot.append("text")
				.attr("class","headers")
				.attr("x" , startxforheaders )
				.attr("y" , 0)
				.text(  e.label.toUpperCase()  );
			startxforheaders = startxforheaders + labeltextsize;

		}

	});


	var texttobewrappedid = 0;

	console.log(userids)

	userslice = labelfieldsize / userids.length;

	previoushour = mindate;
	thishour = previoushour.plus({ hour: 1 });

	var currenty = margin;
	while(maxdate.diff(previoushour)>0){


		gtot.append("text")
			.attr("class","datelabel")
			.attr("x" , margin + labeldatesize )
			.attr("y" , currenty)
			.text(  previoushour.toString()  );



		var datatowrite = new Object();

		theData.theData.forEach(function(d){
			if( d.theDateTime.diff(previoushour).valueOf()>=0 && d.theDateTime.diff(thishour).valueOf()<=0  ){
				var currentx = margin + labeldatesize + axissize + margin;

				//console.log(d.theDateTime.toString());


				ritualDefinition.datatocollect.forEach(function(e){

					var fid = e.fieldid;

					if( typeof d.jsondata[fid] != 'undefined' && d.jsondata[fid]!=null ){
						if(e.type!="text"){
							var c = colorschemes[fid]( d.jsondata[fid] );

							var offset = -userslice;
							var found = false;
							for(var i = 0; i<userids.length && !found ; i++){
								offset = offset + userslice;
								if(userids[i]==d.userid){
									found = true;
								}
							}


							gtot.append("rect")
								.attr("x",currentx + offset)
								.attr("y",currenty)
								.attr("width",userslice)
								.attr("height",rowheight*0.7)
								.attr("fill",c);
								//.attr("opacity",0.5);
						} else {
							// gtot.append("text")
								// .attr("class","notecontent")
								// .attr("x" , currentx )
								// .attr("y" , currenty)
								// .text(  unescape(d.jsondata[fid])  );

								var txt = "[ " + unescape(d.jsondata[fid]).trim() + " ]"; 
								if(txt!="[  ]"){
									if(typeof datatowrite[fid] == 'undefined' ){
										datatowrite[fid] = new Object();
										datatowrite[fid].x = currentx;
										datatowrite[fid].y = currenty;
										datatowrite[fid].txt = txt;
									} else {
										datatowrite[fid].txt = datatowrite[fid].txt + txt;
									}	
								}
								
						}		
					}

					if(e.type=="text"){
						currentx = currentx + labeltextsize + margin;
					} else {
						currentx = currentx + labelfieldsize + margin;
					}
				});

			}
		});

		var kd = Object.keys(datatowrite);

		kd.forEach(function(d){
			var text_rep = gtot.append("text")
				.attr("class","notecontent")
				.attr("id","notecontent" + texttobewrappedid )
				.attr("x" , datatowrite[d].x )
				.attr("y" , datatowrite[d].y);
				//.text(  datatowrite[d].txt  );
			var text = new text_object(text_rep , "notecontent" + texttobewrappedid);
			text.setContent(datatowrite[d].txt);
			text.resetText(33);
			text.wrap(labeltextsize);

			texttobewrappedid++;
		});


		currenty = currenty + rowheight;
		previoushour = thishour;
		thishour = previoushour.plus({ hour: 1 });
	}



}





/*
text object
for wrapping
*/

function text_object(text_rep,id){
	//initial variables
	this.str_ = '', this.font_size = 33, this.text_object = text_rep, this.scale_=null, this.dy = '.88em';
	this.id = id;
	var text_height=0, text_width =0, lines = 1;

	//BASIC FUNCTIONS
	//+++++++++++++++
	this.setContent = function(content){
		this.str_ = content;
		this.text_object.text(this.str_)
	}
	this.getContent = function(){return this.str_}
	this.getFontSize = function(){return this.font_size}
	this.getHeight = function(){return text_height}
	this.setFontSize=function(fontsize){
		this.font_size = fontsize;
		this.text_object.attr('font-size',this.font_size+'pt').attr('dy',this.dy)
		this.check_text_dimensions();

	}
	//+++++++++++++++
	//TRANSFORMING FUNCTIONS
	//+++++++++++++++
	this.scale=function(width_, height_){
		//get the scaling parameters
		this.scale_ = this.getScale(width_, height_);
		//transform (scale) svg-text element
		this.text_object.attr('transform',"scale("+this.scale_.a+","+this.scale_.b+")");
	}
	this.wrap=function(width){
		var total_ = 0, counter = 1;
		//get an array - representation of the text
		var raw_text = this.str_.split('');
		//select the svg container
		var svg_ = d3.select('svg');
		//for each letter in the array
		for(var i =0; i<raw_text.length; i++){
			//dummy svg-text element, to...
			//console.log("fs:" + this.font_size);
			var letter = svg_.append('text').attr('font-size',this.font_size+'pt').attr('id','dummy_text').text(this.str_[i]);
			//...get the size of each letter-representation
			total_=total_ + document.getElementById("dummy_text").getBBox().width;	//letter.node().clientWidth;
			//if the letters are too long for the box...
			if(total_>=width){
				total_=0;					//...reset total length
				counter = counter +1;		
				raw_text.splice(i,0,'_')	//...add a separator
			}
			//remove the dummy svg-text element
			letter.remove();
		}
		//make a STRING of the 'text array'
		var text_='';
		raw_text.forEach(function(d){text_=text_+d;})

		//wrap the visual representation of the text
		this.wrapTextObject(text_);
		lines = counter;
	}
	this.wrapTextObject=function(content){
		//split the text at the separator
		var t_wrapped = content.split('_');
			//loop the parts
			if(t_wrapped.length>1){
				//the first line is 'our' normal svg-text element
				text_rep.text(t_wrapped[0])
				//all following lines are a svg-text-tspan element
				for(var i=1;i<t_wrapped.length;i++){
					this.text_object.append('tspan').attr('x', parseFloat(this.text_object.attr("x")) ).attr('dy','.85em').attr('y', parseFloat(this.text_object.attr("y")) + text_height*i).text(t_wrapped[i])					
				}
			}
	}
	this.wrap_and_scale=function(box_){
		//1st...wrap it
		this.wrap(box.x);
		//2nd...scale it
		this.scale(box.x, box.y);
	}
	this.scaleFontSizeToBox=function(width_, height_){
		//get the scaling parameters
		this.scale_ = this.getScale(width_, height_);
		//scale font size to scaling parameter a
		this.setFontSize(this.font_size * this.scale_.a);
	}
	this.resetText=function(fontsize){
		this.text_object.attr('transform',"scale(1,1)");
		this.setFontSize(fontsize);
	}
	//+++++++++++++++
	//CALCULATING FUNCTIONS
	//+++++++++++++++
	this.check_text_dimensions = function(){
		text_width = document.getElementById(this.id).getBBox().width;	//this.text_object.node().offsetWidth;
		text_height = document.getElementById(this.id).getBBox().height;	//this.text_object.node().offsetHeight;
	}	
	this.getScale=function (width_, height_){
		this.check_text_dimensions();

		var a = width_/text_width;
		var b = height_/text_height;
		
		return {a:a, b:b};
	}	
}