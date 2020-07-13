var APIBaseUrl = "https://he-r.it/DataMeditation/API/index.php";

var login = "";
var password = "";
var groupid = "";
var ritualdata = {};

var isritualtime = false;
var isassemblytime = false;
var iscouplesmeettime = false;


$(document).ready(function () {

	$.getJSON("data/ritual.json?v=" + Math.random()*Math.random() ,function(data){

		ritualdata = data;
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
	console.log("[refreshInterface]");
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


	console.log("isritualtime:");
	console.log(isritualtime);

	console.log("isassemblytime:");
	console.log(isassemblytime);

	console.log("iscouplesmeettime:");
	console.log(iscouplesmeettime);



	// do server side tasks depending on current time / date and status variables
	
	// update interfaces
	if(isritualtime){
		console.log("[ritual on]");
		$("#ritualwaitroompanel").css("display","block");
	} else {
		console.log("[ritual off]");
		$("#ritualwaitroompanel").css("display","none");
	}

	if(isassemblytime){
		console.log("[assembly on]");
		$("#assemblypanel").css("display","block");
	} else {
		console.log("[assembly off]");
		$("#assemblypanel").css("display","none");
	}

	if(iscouplesmeettime){
		console.log("[couples on]");
		$("#couplespanel").css("display","block");
	} else {
		console.log("[couples off]");
		$("#couplespanel").css("display","none");
	}
	
	// turn on notifications
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

function doLogin(){
	login = $("#login").val().trim().toUpperCase();
	password = $("#password").val().trim().toUpperCase();
	groupid = $("#groupid").val().trim().toUpperCase();
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

	thatDate = new Date(ofDay);

	startDate = new Date(thatDate.getTime());
	startDate.setHours(startTime.split(":")[0]);
	startDate.setMinutes(startTime.split(":")[1]);
	startDate.setSeconds(startTime.split(":")[2]);

	endDate = new Date(thatDate.getTime());
	endDate.setHours(endTime.split(":")[0]);
	endDate.setMinutes(endTime.split(":")[1]);
	endDate.setSeconds(endTime.split(":")[2]);


	valid = startDate < currentDate && endDate > currentDate
	return valid;
}
