var flashCounter = 0;
var $flashButton = $('#flashButton');
var $powerButton = $('#powerButton');
var $powerButtonOff = $('#powerButtonOff');
var $display = $('.seven-segment');
var $walkButton = $('#walkButton');
var $doseUpButton = $('#doseUpButton');
var $doseNumber = $('#doseNumber');
var $doseButton = $('.doseButton');
var $greenLED = $('.ledGreen');
var $redLED = $('.ledRed');
var $beeper = $('#beeper')[0];
var $beeperLong = $('#beeper-long')[0];
var powered = false;
var on = 'on';
var off = 'off';
var doseButtonFirstPress = false;
var doseLockout = false;
var doseCount = 0;
var greenLEDFlash, redLEDFlash;

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

var walkpattern = [
	['ones','a'],
	['ones','b'],
	['ones','c'],
	['ones','d'],
	['tens','d'],
	['tens','e'],
	['tens','f'],
	['tens','a']];

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

	$powerButtonOff.click('submit',function(){
		powered = false;
		turnOffLCD();
		turnOffAllLED();
		doseCount = 0;
		clearInterval(timer);
		clearInterval(walkPatternTimer);
		clearInterval(doseRepeatTimer);
	})

	$flashButton.click('submit',function(){
		if(powered) flashLCD(9);
	});

	$doseUpButton.click('submit',function(){
		if(powered && !doseLockout) setDose();
	});

	$walkButton.click('submit',function(){
		if(powered) walkLCD();
	});

	$doseNumber.change(function(){
		var number = parseInt($doseNumber.val(),10);
		if(powered){
			setLCDNum(number);
			doseCount = number;
		};
	});

	$doseButton.mousedown(function(){
		$doseButton.addClass('doseButtonPressed');
		if(powered && !doseLockout){
			if (doseButtonFirstPress){
				setDose();
				doseButtonFirstPress = false;
			}
			else{
				setTimeout(function(){ doseButtonFirstPress = true; }, 200);
			};
		};
	});
	$doseButton.mouseup(function(){
		setTimeout(function(){
			$doseButton.removeClass('doseButtonPressed');
		},25);
	});

})

$(window).resize(function(){
	//find a way to query the value after xx seconds
	// if it has only moved like 50 pixels, then it must
	// be an address ar hide, and DON'T adjust spacing
	adjustContentSpacing('section');
})

function powerUp(){
	flashCounter = 0;
	$beeper.play();
	redLEDFlash = setTimeout(function(){
		$redLED.removeClass('hidden');
		setTimeout(function(){
			$redLED.addClass('hidden');
			flashLCD(9);
		},500);
	},500);
	powered = true;
	setTimeout(function(){
		flashGreenLED(500,3000);
	},4000);
}

function flashLCD(limit){
	flashCounter = 0;
	turnOffLCD();
	var timer = setInterval(function(){
		if(flashCounter < limit){
			//$display.find('*').toggleClass('digitOff');
			segmentToggle(digits[8],'tens');
			segmentToggle(digits[8],'ones');
			flashCounter++;
		}
		else{
			clearInterval(timer);
			setLCDNum(doseCount);
		};
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
	//console.log('setting dose counter to '+number);
	if(number>9)
		segmentToggle(digits[Math.floor(number/10)],'tens',on);
		segmentToggle(digits[number%10],'ones',on);
}

//take in an array of segments to toggle, place (tens or ones), and toggle just those
function segmentToggle(input,place,explicit){ 
	//console.log('toggling '+input);
	for(var segment in input)
	{
		segmentClass = '.'+input[segment];
		placeClass = '.'+place;
		//console.log('segment '+input[segment]+' '+explicit+' (class '+segmentClass+')');
		if(explicit == on)
			$(placeClass).find(segmentClass).removeClass('digitOff');
		else if (explicit == off)
			$(placeClass).find(segmentClass).addClass('digitOff');
		else
			$(placeClass).find(segmentClass).toggleClass('digitOff');
	}

}

function walkLCD(){
	var walkCounter = 0;
	var wtPlace, wtNumber;
	var walkPatternTimer = setInterval(function(){
		turnOffLCD();
		wtPlace = walkpattern[walkCounter][0];
		wtNumber = walkpattern[walkCounter][1];
		segmentToggle(wtNumber,wtPlace,on);
		if(walkCounter < 7)
			walkCounter++;
		else
			walkCounter = 0;
	},200);
	var walkTimer = setTimeout(function(){
		clearInterval(walkPatternTimer);
		setLCDNum(doseCount);
	},3200);
}

function setDose(){
	doseLockout = true;
	turnOffLCD();
	turnOffAllLED();
	$beeperLong.play();
	flashGreenLED(400,800);
	walkLCD();
	var doseRepeatTimer = setInterval(function(){
		walkLCD();
	},5600);
	var doseTimer = setTimeout(function(){
		clearInterval(doseRepeatTimer);
		turnOffAllLED();
		flashGreenLED(500,3000);
		doseCount++;
		setLCDNum(doseCount);
		$doseNumber.val(doseCount);
		doseLockout = false;
	},20000)
	
}

function flashGreenLED(ontime,offtime){
	if(powered){
		greenLEDFlash = setInterval(function(){
			$greenLED.removeClass('hidden');
			setTimeout(function(){
				$greenLED.addClass('hidden');
			},ontime);
		},offtime);
	}
}

function turnOffAllLED(){
	clearInterval(greenLEDFlash);
}