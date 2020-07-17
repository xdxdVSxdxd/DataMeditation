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
			APIBaseUrl + "?cmd=togroup&iduser=" + user.iduser + "&groupid=" + group.group,
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
	$(".panel").fadeOut(function(){
		$(".panel").css("display","none");
		$("#loginpanel").css("display","block");
		$("#loginpanel").fadeIn(function(){
			//
		});	
	});
}


function toMenu(){
	$(".panel").fadeOut(function(){
		$(".panel").css("display","none");
		$("#menupanel").css("display","block");
		$("#menupanel").fadeIn(function(){
			//
		});	
	});
}

function toDataCollection(){
	$(".panel").fadeOut(function(){
		$(".panel").css("display","none");
		$("#datacollectionpanel").css("display","block");
		$("#datacollectionpanel").fadeIn(function(){
			//
		});	
	});	
}

function fromLogintoMenu(){
	$(".panel").fadeOut(function(){
		$(".panel").css("display","none");
		$("#menupanel").css("display","block");
		$("#menupanel").fadeIn(function(){
			//
		});	
	});	
}

function toAssembly(){
	$(".panel").fadeOut(function(){
		$(".panel").css("display","none");
		$("#assemblypanel").css("display","block");
		$("#assemblypanel").fadeIn(function(){
			//
		});	
	});	
}

function toCouples(){
	$(".panel").fadeOut(function(){
		$(".panel").css("display","none");
		$("#couplespanel").css("display","block");
		$("#couplespanel").fadeIn(function(){
			//
		});	
	});	
}


function toRitualWaitingRoom(){
	$(".panel").fadeOut(function(){
		$(".panel").css("display","none");
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
	// say to API: I logged into the ritual (set timestamp) (cmd=inwaitingroom&userid=x&groupid=y)--> receves array of users in group with 0=absent, 1=present , 2=doing ritual , 3=ended ritual
	// as answer, receive who is in ritual and their status (if status==doing ritual-->show that, if not: if timestamp < ritualdata.ritual.minutestoconsideronline minutes --> show "present" , timestamp > ritualdata.ritual.minutestoconsideronline minutes --> "show "not present"") 
	// draw interface, with the button to join ritual switched off and showing the ritualdata.ritual.waitingforothers message 
	// if number of users that are here is at least number of participants * ritualdata.ritual.atleastthispartofgrouptostartritual --> turn on "join ritual" button
	// when you press the join ritual button: clearInterval(waitingroomInterval) , set the "doing ritual" for me using the API, clear and hide the waitingroom, show ritual interface and start ritual by getting the date's data
	// when ritual ends: remember to do *endritual* with API
}


var waitingroomInterval = null;

function doLogin(){
	login = $("#login").val().trim().toUpperCase();
	password = $("#password").val().trim().toUpperCase();
	groupid = $("#groupid").val().trim().toUpperCase();

	user = null;

	$.getJSON(
		APIBaseUrl + "?cmd=login&login=" + login + "&password=" + password + "&groupid=" + groupid,
		function(data){
			// console.log(data);
			if(data.error){
				if(confirm(data.error)){
					$.getJSON(
						APIBaseUrl + "?cmd=register&login=" + login + "&password=" + password + "&groupid=" + groupid,
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
					APIBaseUrl + "?cmd=togroup&iduser=" + user.iduser + "&groupid=" + groupid,
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
				"groupid": group.groupid
			},
			function(data){
				console.log(data);

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
			var value = $("#datacollectionpanel [name='" + name + "']").val();
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
				"second": second
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
						.attr("value",ritualdata.datatocollect[i].positions[j]);

					fh
						.append("label")
						.attr("for", ritualdata.datatocollect[i].fieldid + j)
						.text(ritualdata.datatocollect[i].positions[j]);
				}
				

			} else if( ritualdata.datatocollect[i].type=="select" ){
				

				var fh = fieldcontainer
						.append("div")
						.attr("class","fieldholder")
						.append("select")
						.attr("name",ritualdata.datatocollect[i].fieldid)
						.attr("id",ritualdata.datatocollect[i].fieldid);

				for(var j=0; j<ritualdata.datatocollect[i].options.length; j++){
					fh	
						.append("option")
						.attr("value",ritualdata.datatocollect[i].options[j])
						.text(ritualdata.datatocollect[i].options[j]);
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
