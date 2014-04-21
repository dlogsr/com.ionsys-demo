var flashCounter = 0;
var $flashButton = $('#flashButton');
var $powerButton = $('#powerButton');
var $display = $('.seven-segment');
var $walkButton = $('#walkButton');
var $doseButton = $('#doseButton');
var $doseNumber = $('#doseNumber');
var powered = false;
var on = 'on';
var off = 'off';

var digits = new Array;
digits[0] = ['a', 'b', 'c', 'd', 'e', 'f'];
digits[1] = ['b', 'c'];
digits[2] = ['a','b','g','e','d'];
digits[3] = ['a','b','g','c','d'];
digits[4] = ['f','g','b','c'];
digits[5] = ['a','f','g','c','d'];
digits[6] = ['a','f','e','d','c','g'];
digits[7] = ['a','b','c'];
digits[8] = ['a','b','c','d','e','f','g'];
digits[9] = ['a','f','g','b','c','d'];

function getWindowHeight(){
	return $(window).height();
}

function adjustContentSpacing(currSection) {
	var windowHeight = getWindowHeight();
	$(currSection).css({'min-height':windowHeight});
}

$(document).ready(function(){
	adjustContentSpacing('section');
	$display.find('*').addClass('digitOff');


	$powerButton.click('submit',function(){
		if(!powered)
			powerUp();
	})

	$flashButton.click('submit',function(){
		if(powered) flashLCD(9);
	});

	$doseButton.click('submit',function(){
	})

	$walkButton.click('submit',function(){
	})

	$doseNumber.change(function(){
		var number = parseInt($doseNumber.val(),10);
		if(powered) setLCDNum(number);
	})

})

$(window).resize(function(){
	//find a way to query the value after xx seconds
	// if it has only moved like 50 pixels, then it must
	// be an address ar hide, and DON'T adjust spacing
	adjustContentSpacing('section');
})

function powerUp(){
	flashCounter = 0;
	flashLCD(9);
	powered = true;
}

function flashLCD(limit){
	flashCounter = 0;
	turnOffLCD();
	var timer = setInterval(function(){
		if(flashCounter < limit){
			$display.find('*').toggleClass('digitOff');
			flashCounter++;
		}
		else clearInterval(timer);
	},500);
}

function turnOffLCD(){
	$display.find('*').addClass('digitOff');
}

function turnOnLCD(){
	$display.find('*').removeClass('digitOff');	
}

function setLCDNum(number){
	turnOffLCD();
	console.log('setting dose counter to '+number);
	if(number>9)
		segmentToggle(digits[Math.floor(number/10)],'tens',on);
	segmentToggle(digits[number%10],'ones',on);
}

//take in an array of segments to toggle, place (tens or ones), and toggle just those
function segmentToggle(input,place,explicit){ 
	console.log('toggling '+input);
	for(var segment in input)
	{
		segmentClass = '.'+input[segment];
		placeClass = '.'+place;
		console.log('segment '+input[segment]+' '+explicit+' (class '+segmentClass+')');
		if(explicit == on)
			$(placeClass).find(segmentClass).removeClass('digitOff');
		else if (explicit == off)
			$(placeClass).find(segmentClass).addClass('digitOff');
		else
			$(placeClass).find(segmentClass).toggleClass('digitOff');
	}

}

function walkLCD(){

}

function setDose(){

}