var APIBaseUrl = "https://he-r.it/DataMeditation/API/index.php";

var login = "";
var password = "";
var groupid = "";
var ritualdata = {};

var isritualtime = false;
var isassemblytime = false;
var iscouplesmeettime = false;

var user = null;
var group = null;


var dataforritual = null;


$(document).ready(function () {

	$.getJSON("data/ritual.json?v=" + Math.random()*Math.random() ,function(data){

		ritualdata = data;
		setupmenuitems();
		setupdatacollectionform();
		start();
	});
	
	
});


var timerrefresh = null;
function setTiming(){
	if(timerrefresh!=null){
		clearInterval(timerrefresh);
	}
	setInterval(refreshInterface,ritualdata.refreshtimems);
}

function refreshInterface(){
	//console.log("[refreshInterface]");
	// set status variables according to cureent time / date
	var currentdate = new Date();
	if( checkifitstime(currentdate,ritualdata.ritual.starttime,ritualdata.ritual.endtime) ){
		isritualtime = true;
	} else {
		isritualtime = false;
	}

	if( 
		checkifitstime(currentdate,ritualdata.assembly.eachdaystarttime,ritualdata.assembly.eachdayendtime)  ||
		checkifitsdatetime(currentdate,ritualdata.assembly.finaldaystarttime,ritualdata.assembly.finaldayendtime,ritualdata.finalday) 

	){
		isassemblytime = true;
	} else {
		isassemblytime = false;
	}


	if( 
		checkifitsdatetime(currentdate,ritualdata.couplesmeet.starttime,ritualdata.couplesmeet.endtime,ritualdata.finalday) 

	){
		iscouplesmeettime = true;
	} else {
		iscouplesmeettime = false;
	}


	// console.log("isritualtime:");
	//console.log(isritualtime);

	//console.log("isassemblytime:");
	//console.log(isassemblytime);

	//console.log("iscouplesmeettime:");
	//console.log(iscouplesmeettime);



	// do server side tasks depending on current time / date and status variables
	// TODO


	if(user!=null && group!=null ){
		// console.log("[checkin to group]");
		// sign in to group
		$.getJSON(
			APIBaseUrl + "?cmd=togroup&iduser=" + user.iduser + "&groupid=" + group.group + "&v=" + Math.random()*Math.random(),
			function(data){
				// console.log(data);

				if(data.error){
					alert(data.error);
					user = null;
					group = null;
					toLogin();
				} else {
					group = data;	
				}
				
			}
		);
	}


	
	// update interfaces
	if(isritualtime){
		//console.log("[ritual on]");
		$("#gotoritualwaitroom").css("display","block");
	} else {
		//console.log("[ritual off]");
		$("#gotoritualwaitroom").css("display","none");
	}

	if(isassemblytime){
		//console.log("[assembly on]");
		$("#gotoassembly").css("display","block");
	} else {
		//console.log("[assembly off]");
		$("#gotoassembly").css("display","none");
	}

	if(iscouplesmeettime){
		//console.log("[couples on]");
		$("#gotocouples").css("display","block");
	} else {
		//console.log("[couples off]");
		$("#gotocouples").css("display","none");
	}
	
	// turn on notifications
	// TODO
}

function start(){

	setTiming();

	/*
	if(login=="" || password=="" || groupid=="" ){
		toLogin();
	}
	*/

	$("#submitlogin").click(function(){
		doLogin();
	});
}


function toLogin(){
	$(".panel  , .panelcover").fadeOut().promise().done(function() {
		$(".panel , .panelcover").css("display","none");
		$("#loginpanel").css("display","block");
		$("#loginpanel").fadeIn(function(){
			//
		});
	});
			
}


function toMenu(){
	if(waitingroomInterval!=null){
		clearInterval(waitingroomInterval);
	}
	$(".panel , .panelcover").fadeOut().promise().done(function() {
		$(".panel , .panelcover").css("display","none");
		$("#menupanel").css("display","block");
		$("#menupanel").fadeIn(function(){
			//
		});
	});
			
}

function toDataCollection(){
	$(".panel , .panelcover").fadeOut().promise().done(function() {
		$(".panel , .panelcover").css("display","none");
		$("#datacollectionpanel").css("display","block");
		$("#datacollectionpanel").fadeIn(function(){
			//
		});	
		
	});	
		
}

function fromLogintoMenu(){
	$(".panel , .panelcover").fadeOut().promise().done(function() {
		$(".panel , .panelcover").css("display","none");
		$("#menupanel").css("display","block");
		$("#menupanel").fadeIn(function(){
			//
		});	
		
	});	
		
}

function toAssembly(){
	$(".panel , .panelcover").fadeOut().promise().done(function() {
		$(".panel , .panelcover").css("display","none");
		$("#assemblypanel").css("display","block");
		$("#assemblypanel").fadeIn(function(){
			//
		});	
	});	
		
}

function toCouples(){
	$(".panel , .panelcover").fadeOut().promise().done(function() {
		$(".panel , .panelcover").css("display","none");
		$("#couplespanel").css("display","block");
		$("#couplespanel").fadeIn(function(){
			//
		});
	});	
			
}


function toRitualWaitingRoom(){
	
	$("#joinritualbutton").css("display","none");

	$(".panel , .panelcover").fadeOut().promise().done(function() {
		$(".panel , .panelcover").css("display","none");
		$("#ritualwaitroompanel").css("display","block");
		$("#ritualwaitroompanel").fadeIn(function(){
			//
			if(waitingroomInterval!=null){
				clearInterval(waitingroomInterval);
			}
			waitingroomInterval = setInterval(refreshWaitingRoom,ritualdata.refreshtimems);
		});	
	});
		
}

function refreshWaitingRoom(){ 
	//console.log("[in waiting room]");
	// say to API: I logged into the ritual (set timestamp) (cmd=inwaitingroom&userid=x&groupid=y)--> receves array of users in group with 0=absent, 1=present , 2=doing ritual , 3=ended ritual
	// as answer, receive who is in ritual and their status (if status==doing ritual-->show that, if not: if timestamp < ritualdata.ritual.minutestoconsideronline minutes --> show "present" , timestamp > ritualdata.ritual.minutestoconsideronline minutes --> "show "not present"") 
	if(user!=null && group!=null){

		$.getJSON(
			APIBaseUrl + "?cmd=inwaitingroom&userid=" + user.iduser + "&groupid=" + group.groupid + "&recentness=" + ritualdata.ritual.minutestoconsideronline + "&v=" + Math.random()*Math.random(),
			function(data){
				//console.log(data);

				if(data.error){
					alert(data.error);
				} else {

						// continue
						// draw interface, with the button to join ritual switched off 
						// and showing the ritualdata.ritual.waitingforothers message

						var waitingroomcontainer = d3.select("#peopleintheroom");

						var t = d3.transition()
      							.duration(750);

						var usersinritual = waitingroomcontainer.selectAll(".userinwaitingroom")
							.data(data.usersingroup, function(d){ return d; });

							var enter = usersinritual.enter()
										.append('div')
										.attr("class",function(d){
											var c = "userinwaitingroom";
											if(d.status == 0){
												c = c + " userabsent";
											} else if(d.status == 1){
												c = c + " userwaiting";
											} else if(d.status == 2){
												c = c + " usersinritual";
											} else if(d.status == 3){
												c = c + " useroutofritual";
											}
											return c;
										})
										.text(function(d){ return d.login; })
										.merge(usersinritual)
										.transition()
  										.duration(750);

							var exit = usersinritual.exit().remove();


						// if number of users that are here is at least number of participants * ritualdata.ritual.atleastthispartofgrouptostartritual --> turn on "join ritual" button
						var minnumberofusers = Math.floor( data.usersingroup.length*ritualdata.ritual.atleastthispartofgrouptostartritual );
						var userscurrentlyhere = 0;
						for(var i = 0; i<data.usersingroup.length ; i++){
							if(data.usersingroup[i].status>0){
								userscurrentlyhere++;
							}
						}

						if(userscurrentlyhere>=minnumberofusers){ 
							$("#joinritualbutton").css("display","block");
						} else {
							$("#joinritualbutton").css("display","none");
						}

						
						
						// when ritual ends: remember to do *endritual* with API
						// TODO
				}
				
			}
		);

	}
		
}


var waitingroomInterval = null;

function doLogin(){
	login = $("#login").val().trim().toUpperCase();
	password = $("#password").val().trim().toUpperCase();
	groupid = $("#groupid").val().trim().toUpperCase();

	user = null;

	$.getJSON(
		APIBaseUrl + "?cmd=login&login=" + login + "&password=" + password + "&groupid=" + groupid + "&v=" + Math.random()*Math.random(),
		function(data){
			// console.log(data);
			if(data.error){
				if(confirm(data.error)){
					$.getJSON(
						APIBaseUrl + "?cmd=register&login=" + login + "&password=" + password + "&groupid=" + groupid + "&v=" + Math.random()*Math.random(),
						function(data){
							if(data.error){
								alert(data.error);
							} else {
								user = data;
							}
						}
					);
				}
			}  else {
				user = data;
			}

			if(user!=null){
				// sign in to group
				$.getJSON(
					APIBaseUrl + "?cmd=togroup&iduser=" + user.iduser + "&groupid=" + groupid + "&v=" + Math.random()*Math.random(),
					function(data){
						// console.log(data);

						if(data.error){
							alert(data.error);
						} else {
							// if success: show menu
							group = data;
							doCouples();
							fromLogintoMenu();
						}
						
					}
				);
			}
		}
	);
}

function doCouples(){

	$.getJSON(
			APIBaseUrl,
			{
				"cmd": "getmycouple",
				"userid": user.iduser,
				"groupid": group.groupid,
				"v": Math.random()*Math.random()
			},
			function(data){
				//console.log(data);

				if(data.error){
					alert(data.error);
				} else {
					// if success: show menu
					
					$("#couplespanel").html("");

					for(var i = 0; i<data.couples.length; i++){
						d3.select("#couplespanel")
									.append("a")
									.attr("href", data.couples[i].linktochat )
									.attr("target","_blank")
									.append("div")
									.attr("class","menuitem")
									.text("go to meet your other");
					}

					d3.select("#couplespanel")
									.append("a")
									.attr("href", ritualdata.assemblyjitsymeet )
									.attr("target","_blank")
									.append("div")
									.attr("class","menuitem")
									.attr("id","gotoassembly2")
									.text("go to assembly");

				}
				
			}
	);

}

function doSendData(){
	// collect data from form
	// send it to server
	// provide feedback

	if(typeof ritualdata.datatocollect != 'undefined'){
		var result = new Object();
		for(var i = 0; i<ritualdata.datatocollect.length; i++){
			var name = ritualdata.datatocollect[i].fieldid;
			var value = $("#datacollectionpanel [name='" + name + "']:checked").val();
			result[name] = value;
		}

		// console.log(result);

		var cd = new Date();
		var year = cd.getUTCFullYear();
		var month = cd.getUTCMonth() + 1;
		var day = cd.getUTCDate();
		var hour = cd.getHours();
		var minute = cd.getMinutes();
		var second = cd.getSeconds();

		$.getJSON(
			APIBaseUrl,
			{
				"cmd": "updata",
				"userid": user.iduser,
				"groupid": group.groupid,
				"jsondata": JSON.stringify(result),
				"year": year,
				"month": month,
				"day": day,
				"hour": hour,
				"minute": minute,
				"second": second,
				"v": Math.random()*Math.random()
			},
			function(data){
				// console.log(data);

				if(data.error){
					alert(data.error);
				} else {
					// if success: show menu
					alert("Data shared!");
				}
				
			}
		);
	}


}

function checkifitstime(currentDate,startTime,endTime){

	//console.log("----------------");
	//console.log("[checkifitstime]");

	//console.log("currentDate:");
	//console.log(currentDate);

	//console.log("startTime:");
	//console.log(startTime);

	//console.log("endTime:");
	//console.log(endTime);


	startDate = new Date(currentDate.getTime());
	startDate.setHours(startTime.split(":")[0]);
	startDate.setMinutes(startTime.split(":")[1]);
	startDate.setSeconds(startTime.split(":")[2]);

	endDate = new Date(currentDate.getTime());
	endDate.setHours(endTime.split(":")[0]);
	endDate.setMinutes(endTime.split(":")[1]);
	endDate.setSeconds(endTime.split(":")[2]);


	// console.log("startDate:");
	// console.log(startDate);

	// console.log("endDate:");
	// console.log(endDate);


	// console.log("result:");
	// console.log( (startDate < currentDate && endDate > currentDate)  );

	valid = startDate < currentDate && endDate > currentDate
	return valid;
}


function checkifitsdatetime(currentDate,startTime,endTime,ofDay){

	//console.log("currentDate:" + currentDate);
	//console.log("startTime:" + startTime);
	//console.log("endTime:" + endTime);
	//console.log("ofDay:" + ofDay);

	thatDate = new Date( Date.parse(ofDay + " 00:00:00 " + ritualdata.referencetimezone ) );

	//console.log("......");
	//console.log("thatDate:" + thatDate);

	startDate = new Date(thatDate.getTime());
	startDate.setHours(startTime.split(":")[0]);
	startDate.setMinutes(startTime.split(":")[1]);
	startDate.setSeconds(startTime.split(":")[2]);

	endDate = new Date(thatDate.getTime());
	endDate.setHours(endTime.split(":")[0]);
	endDate.setMinutes(endTime.split(":")[1]);
	endDate.setSeconds(endTime.split(":")[2]);


	//console.log("......");
	//console.log("startDate:" + startDate);
	//console.log("endDate:" + endDate);

	valid = startDate < currentDate && endDate > currentDate
	return valid;
}


function setupmenuitems(){
	$("#gotologin").click(function(){
		user = null;
		group = null;
		toLogin();
	});

	$("#toMenu").click(function(){
		toMenu();
	});

	$("#gotodata").click(function(){
		toDataCollection();
	});

			d3.select("#watingmessage").text(ritualdata.ritual.waitingforothers);



	d3.select("#assemblypanel")
					.append("a")
					.attr("href", ritualdata.assemblyjitsymeet )
					.attr("target","_blank")
					.append("div")
					.attr("class","menuitem")
					.attr("id","gotoassembly3")
					.text("go to assembly");

	$("#gotoassembly").click(function(){
		toAssembly();
	});

	$("#gotocouples").click(function(){
		toCouples();
	});

	$("#gotoritualwaitroom").click(function(){
		toRitualWaitingRoom();
	});



	$("#joinritualbutton").click(function(){
		startRitual();
	});



}


function startRitual(){
	//console.log("[in startRitual]");
	if(user!=null && group!=null){
		// when you press the join ritual button: clearInterval(waitingroomInterval) , 
		if(waitingroomInterval!=null){
			clearInterval(waitingroomInterval);
			waitingroomInterval = null;
		}
		// set the "doing ritual" for me using the API,

		var dateObj = new Date();
		var month = dateObj.getUTCMonth() + 1; //months from 1-12
		var day = dateObj.getUTCDate();
		var year = dateObj.getUTCFullYear();

		$.getJSON(
			APIBaseUrl,
			{
				"cmd": "getmycoupledataforritual",
				"userid": user.iduser,
				"groupid": group.groupid,
				"year": year,
				"month": month,
				"day": day,
				"v": Math.random()*Math.random()
			},
			function(data){
				//console.log(data);

				dataforritual = data;

				dataforritual.theData.myData.forEach(function(d){
					d.hour = +d.hour;
					d.minute = +d.minute;
					d.second = +d.second;
				});

				dataforritual.theData.theOthersData.forEach(function(d){
					d.hour = +d.hour;
					d.minute = +d.minute;
					d.second = +d.second;
				});

				if(data.error){
					alert(data.error);
				} else {
					// if success: show menu
					console.log(dataforritual);
					visualize();
				}
				
			}
		);


		// clear and hide the waitingroom, 
		// show ritual interface and start ritual by getting the date's data	
	}
	
}

function setupdatacollectionform(){
	var formcontainer = d3.select("#datacollectionpanel").append("div").attr("class","datacollectionform");
	if(typeof ritualdata.datatocollect != 'undefined'){
		for(var i = 0; i<ritualdata.datatocollect.length; i++){
			// add field
			var fieldcontainer = formcontainer.append("div").attr("class","fieldcontainer");
			fieldcontainer.append("div").attr("class","fieldlables").text(ritualdata.datatocollect[i].label);
			if( ritualdata.datatocollect[i].type=="switch" ){
				
				var fh = fieldcontainer
						.append("div")
						.attr("class","fieldholder");

				for(var j=0; j<ritualdata.datatocollect[i].positions.length; j++){
					fh	
						.append("input")
						.attr("type","radio")
						.attr("name",ritualdata.datatocollect[i].fieldid)	
						.attr("id",ritualdata.datatocollect[i].fieldid + j)
						.attr("value",ritualdata.datatocollect[i].positions[j][0]);

					fh
						.append("label")
						.attr("for", ritualdata.datatocollect[i].fieldid + j)
						.text(ritualdata.datatocollect[i].positions[j][0]);
				}
				

			} else if( ritualdata.datatocollect[i].type=="select" ){
				

				var fh = fieldcontainer
						.append("div")
						.attr("class","fieldholder")
						.append("select")
						.attr("name",ritualdata.datatocollect[i].fieldid)
						.attr("id",ritualdata.datatocollect[i].fieldid);

				for(var j=0; j<ritualdata.datatocollect[i].positions.length; j++){
					fh	
						.append("option")
						.attr("value",ritualdata.datatocollect[i].positions[j][0])
						.text(ritualdata.datatocollect[i].positions[j][0]);
				}
				

			} else if( ritualdata.datatocollect[i].type=="range" ){

				// todo
				
			} else if( ritualdata.datatocollect[i].type=="text" ){

				var fh = fieldcontainer
						.append("div")
						.attr("class","fieldholder")
						.append("input")
						.attr("type","text")
						.attr("name",ritualdata.datatocollect[i].fieldid)
						.attr("id",ritualdata.datatocollect[i].fieldid);
			}

		}


		formcontainer.append("div")
					.attr("class","menuitem")
					.attr("id","senddata")
					.text("send data");

		$("#senddata").click(function(){
			doSendData();
		});
	}
}



function visualize(){
	//console.log("[visualize]");
	//do visualization con variabile dataforritual
	$(".panel , .panelcover").fadeOut().promise().done(function() {
		$(".panel , .panelcover").css("display","none");
		$("#ritualinterfacepanel").css("display","block");
		$("#ritualinterfacepanel").fadeIn(function(){
			viz();
		});	
	});
		
}


var p5sketch = null;
function viz(){
	//console.log("[viz]");

	$("#toMenu").css("display","none");

	p5sketch = null;
	p5sketch = new p5(( sketch ) => {

	  let x = 100;
	  let y = 100;
	  var width = $("#vizpanel").width();
	  var height = $("#vizpanel").height();

	  var h = 0;
	  var m = 0;
	  var s = 0;

	  var inc = 15;

	  var ph = 0;
	  var pm = 0;
	  var ps = 0;

	  var sounds = new Object();

	  var minutebass = null;
	  var hourbass = null;
	  var atmo = null;


	  var towriteme = null;
	  var towriteother = null;

	  sketch.preload = () => {
		  sketch.soundFormats('wav', 'mp3', 'ogg');

		  
		  minutebass = sketch.loadSound( ritualdata.ritual.minutebass );
		  hourbass = sketch.loadSound( ritualdata.ritual.hourbass );
		  atmo = sketch.loadSound( ritualdata.ritual.atmosphere );

		  
		  for(var i = 0; i<ritualdata.datatocollect.length; i++){
		  	if(ritualdata.datatocollect[i].positions){
		  		for(var j = 0; j<ritualdata.datatocollect[i].positions.length; j++){
		  			var key = ritualdata.datatocollect[i].positions[j][0];
		  			key = key.replace(/[\W_]+/g,"_");
		  			sounds[  key ] = sketch.loadSound(  ritualdata.datatocollect[i].positions[j][1]  );
		  		}
		  	}	
		  }
		  

		}
	  
	  sketch.setup = () => {

	    var ca = sketch.createCanvas(width, height);
	    ca.parent("vizpanel");
	    sketch.frameRate(10);
	    atmo.loop();
	    sketch.fill(0,0,0);
	    sketch.noStroke();
	    sketch.rect(0,0,width,height);
	  };

	  sketch.draw = () => {
	    //sketch.background(255*sketch.random(),255*sketch.random(),255*sketch.random());
	    sketch.fill(0,0,0,10);
	    sketch.noStroke();
	    sketch.rect(0,0,width,height);

	    s = s + inc;
	    if(s>=60){
	    	s = s - 60;
	    	m = m + 1;

	    	if(m>=60){
	    		m = 0;
	    		h = h + 1;
	    		if(h>=24){

	    			sketch.noLoop();
	    			atmo.stop();

	    			endRitual();

	    		}
	    	}
	    }

	    // var strtime = ph + ":" + pm + ":" + ps + " --> " + h + ":" + m + ":" + s;
	    var strtime = (h<10?"0":"") + h + ":" + (m<10?"0":"") + m + ":" + (s<10?"0":"") + s;

	    //console.log( ph + ":" + pm + ":" + ps + " -->" + h + ":" + m + ":" + s );


	   // se h-m-s della lista dei due set di dati è compresa tra ph-pm-ps e h-m-s 
	   // suono il suono relativo
	   // e disegno / coloro

	   
	   var phdate = Date.parse("01/01/2011 " + ph  + ":" + pm + ":" + ps);
	   var hdate = Date.parse("01/01/2011 " + h  + ":" + m + ":" + s);




	   // my data

	   var towrite = new Array();

	   
	   for(var i=0; i<dataforritual.theData.myData.length; i++){
	   	//console.log(dataforritual.theData.myData[i]);
	
		var thedate = Date.parse("01/01/2011 " + dataforritual.theData.myData[i].hour  + ":" + dataforritual.theData.myData[i].minute + ":" + dataforritual.theData.myData[i].second);	   	

	   	if(phdate<=thedate && hdate>=thedate){


	   				//console.log("FOUND!");
	   				// play draw
	   				var jdata = JSON.parse(  dataforritual.theData.myData[i].jsonstring );

	   				//console.log("jdata:");
	   				//console.log(jdata);



	   				for(var j = 0; j<ritualdata.datatocollect.length; j++){
	   					var field = ritualdata.datatocollect[j].fieldid;
	   					//console.log("-> field:");
	   					//console.log(field);
	   					if(typeof jdata[field] != 'undefined'){
	   						var value = jdata[field];
		   					//console.log(field + "-->" + value);

		   					
		   					if(value!="no answer"){
		   						towrite.push(  field + "-->" + value  );

		   						var key = value;
				  				key = key.replace(/[\W_]+/g,"_");

				  				//console.log("-> key:");
	   							//console.log(key);

	   							//console.log(sounds[key]);


			   					if(sounds[key]){
			   						sounds[key].pan(-1);
			   						sounds[key].play();
			   					}	
		   					}	
	   					}
	   					
	   				}


	   	}
	   }

	   if(towrite.length>0){

	   		towriteme = towrite;

	   		sketch.fill(255,255,255);
	   		sketch.noStroke();
	   		sketch.rect(0,0,width/2,height);

	   }

	   // end  my data





	   // the other's data

	   towrite = new Array();

	   for(var i=0; i<dataforritual.theData.theOthersData.length; i++){
	   	//console.log(dataforritual.theData.myData[i]);
	
		var thedate = Date.parse("01/01/2011 " + dataforritual.theData.theOthersData[i].hour  + ":" + dataforritual.theData.theOthersData[i].minute + ":" + dataforritual.theData.theOthersData[i].second);	   	

	   	if(phdate<=thedate && hdate>=thedate){


	   				//console.log("FOUND!");
	   				// play draw
	   				var jdata = JSON.parse(  dataforritual.theData.theOthersData[i].jsonstring );

	   				//console.log("jdata:");
	   				//console.log(jdata);



	   				for(var j = 0; j<ritualdata.datatocollect.length; j++){
	   					var field = ritualdata.datatocollect[j].fieldid;
	   					//console.log("-> field:");
	   					//console.log(field);
	   					if(typeof jdata[field] != 'undefined'){
	   						var value = jdata[field];
		   					//console.log(field + "-->" + value);

		   					
		   					if(value!="no answer"){
		   						towrite.push(  field + "-->" + value  );

		   						var key = value;
				  				key = key.replace(/[\W_]+/g,"_");

				  				//console.log("-> key:");
	   							//console.log(key);

	   							//console.log(sounds[key]);


			   					if(sounds[key]){
			   						sounds[key].pan(1);
			   						sounds[key].play();
			   					}	
		   					}	
	   					}
	   					
	   				}


	   	}
	   }

	   if(towrite.length>0){
	   		sketch.fill(255,255,255);
	   		sketch.noStroke();
	   		sketch.rect(width/2,0,width/2,height);

	   		towriteother = towrite;

	   }

	   // end  the other's data



if(towriteme!=null){

			var fheight = 25;
	   		var margin = 5;
	   		var starty = height/2 - towriteme.length*(fheight+margin)/2;
	   		sketch.fill(255,0,0);
		   	sketch.textSize(fheight);
			sketch.textAlign(sketch.LEFT,sketch.CENTER);
			sketch.textFont('Helvetica');
			for(var k = 0; k<towriteme.length; k++){
				sketch.text(towriteme[k], margin, starty + k*(fheight+margin)  );	
			}

}


if(towriteother!=null){

			var fheight = 25;
	   		var margin = 5;
	   		var starty = height/2 - towriteother.length*(fheight+margin)/2;
	   		sketch.fill(255,0,0);
		   	sketch.textSize(fheight);
			sketch.textAlign(sketch.RIGHT,sketch.CENTER);
			sketch.textFont('Helvetica');
			for(var k = 0; k<towriteother.length; k++){
				sketch.text(towriteother[k], width-margin, starty + k*(fheight+margin)  );	
			}

}



		sketch.fill(255,0,0);
		sketch.textSize(56);
		sketch.textAlign(sketch.CENTER,sketch.CENTER);
		sketch.textFont('Helvetica');
		sketch.text("YOU", width/4, height-30 );
		sketch.text("YOUR OTHER", 3*width/4, height-30 );	

	   // ogni minuto : basso
	   if(s==0 && m%10==0){
	   	minutebass.play();
	   	sketch.fill(255,0,0);
	   	sketch.noStroke();
	   	var wwww = 30;

	   	sketch.rect(width/2-wwww/2,0,wwww,height);
	   }




		// draw time
		sketch.fill(0,0,0);
		sketch.noStroke();
		sketch.rect(width/2-150,0,300,30);
		sketch.fill(255,255,255);
		sketch.textSize(20);
		sketch.textAlign(sketch.CENTER,sketch.CENTER);
		sketch.textFont('Helvetica');
		sketch.text(strtime, width/2, 15);
		
	    // at the end
	    ph = h;
	    pm = m;
	    ps = s;

	  };
	});
}


function endRitual(){
	$("#toMenu").css("display","block");
	$("#vizpanel").html("");
	// usare API per settare lo status finito
	$.getJSON(
			APIBaseUrl,
			{
				"cmd": "endritualstatus",
				"userid": user.iduser,
				"groupid": group.groupid,
				"v": Math.random()*Math.random()
			},
			function(data){
				//console.log(data);

				if(data.error){
					alert(data.error);
				} else {
					// if success: show menu
				}
				
			}
		);

	// andare all'assemblea
	toAssembly();
}
