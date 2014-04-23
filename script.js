var flashCounter = 0;
var $flashButton = $('#flashButton');
var $powerButton = $('#powerButton');
var $powerButtonOff = $('#powerButtonOff');
var $walkButton = $('#walkButton');
var $doseUpButton = $('#doseUpButton');
var $doseButton = $('.doseButton');
var $poorSkinButton = $('#poorSkin');
var $EOLButton = $('#EOL');
var $EOUButton = $('#EOU');
var $readyButton = $('#readyButton');
var $deviceStatus = $('#deviceStatus');

var $doseNumber = $('#doseNumber');
var $display = $('.seven-segment');
var $greenLED = $('.ledGreen');
var $redLED = $('.ledRed');
var $beeper = $('#beeper')[0];
var $beeperLong = $('#beeper-long')[0];
var $logoCircle = $('#headerLogoCircle');
var $extraButtons = $('.extraButtons');
var powered = false;
var on = 'on';
var off = 'off';
var doseButtonFirstPress = false;
var doseLockout = false;
var doseCount = 0;
var greenLEDFlash, redLEDFlash;
var beeperTimer, flashTimer, timer, doseRepeatTimer, walkPatternTimer

//phonegap variables
var pgBeeper = '/android_asset/www/beep.mp3';
var pgBeeperLong = '/android_asset/www/beep_long.mp3';

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

var walkpattern = [['ones','a'],['ones','b'],['ones','c'],['ones','d'],['tens','d'],
	['tens','e'],['tens','f'],['tens','a']];

var doseStage = ['Dose 1','Dose 2','Poor Skin 1','Poor Skin 2','EOU','EOL','Power Off'];
var doseStageNum = 0;

function getWindowHeight(){
	return $(window).height();
}

/* PHONEGAP audio functions */

// Audio player
//
var my_media = null;
var mediaTimer = null;

// Play audio
//
function playAudio(src) {
    if (my_media == null) {
        // Create Media object from src
        my_media = new Media(src, onSuccess, onError);
    } // else play current audio
    // Play audio
    my_media.play();
};


function adjustContentSpacing(currSection) {
	var windowHeight = getWindowHeight();
	$(currSection).css({'min-height':windowHeight});
}

$(document).ready(function(){
	adjustContentSpacing('section');
	$powerButtonOff.hide();
	$display.find('*').addClass('digitOff');

	$powerButton.click('submit',function(){
		if(!powered){
			powerUp();
			$powerButton.fadeOut('fast', function(){$powerButtonOff.fadeIn();});
		};
	})

	$powerButtonOff.click('submit',function(){
		if(powered){
			powerDown();
			$powerButtonOff.fadeOut('fast',function(){$powerButton.fadeIn();});
		};
	})

	$poorSkinButton.click('submit',function(){
		if(powered) doseModeEnter('Poor Skin 1');
	})

	$EOUButton.click('submit',function(){
		if(powered) doseModeEnter('EOU');
	})

	$EOLButton.click('submit',function(){
		if(powered) doseModeEnter('EOL');
	})

	$flashButton.click('submit',function(){
		if(powered) flashLCD(88,9);
	});

	$walkButton.click('submit',function(){
		if(powered) walkLCD();
	});

	$doseUpButton.click('submit',function(){
		if(powered && !doseLockout) setDose();
	});

	$readyButton.click('submit',function(){
		if(powered){
			setReadyMode();
			changeStatus('Current mode: Ready');
		};
	});

	$doseNumber.change(function(){
		var number = parseInt($doseNumber.val(),10);
		if(powered){
			setLCDNum(number);
			doseCount = number;
		};
	});

	$logoCircle.click(function(){
		$extraButtons.toggleClass('hidden');
	});

	$doseButton.mousedown(function(){
		$doseButton.addClass('doseButtonPressed');
	});
	$doseButton.mouseup(function(){
		setTimeout(function(){
			$doseButton.removeClass('doseButtonPressed');
		},25);
		if(powered && !doseLockout){
			if (doseButtonFirstPress){
				doseModeEnter(doseStage[doseStageNum]);
				doseButtonFirstPress = false;
			}
			else{
				setTimeout(function(){ doseButtonFirstPress = true; }, 200);
				setTimeout(function(){ doseButtonFirstPress = false;}, 3000);
			};
		};
	});

})

$(window).resize(function(){
	adjustContentSpacing('section');
})

function changeStatus(status){
	$deviceStatus.fadeOut('fast',function() {$deviceStatus.html(status);});
	$deviceStatus.fadeIn('fast');
}

function powerUp(){
	changeStatus('Powering On...');
	flashCounter = 0;
	playAudio(pgBeeper); // $beeper.play();
	redLEDFlash = setTimeout(function(){
		$redLED.removeClass('hidden');
		setTimeout(function(){
			$redLED.addClass('hidden');
			changeStatus('Current mode: POST');
			flashLCD(88,9);
		},500);
	},500);
	powered = true;
	setTimeout(function(){
		flashGreenLED(500,3000);
		setTimeout(function(){changeStatus('Current mode: Ready')},2000);
	},4000);
}

function powerDown(){
	powered = false;
	turnOffLCD();
	turnOffAllLED();
	doseCount = 0;
	clearInterval(flashTimer);
	clearInterval(walkPatternTimer);
	clearInterval(doseRepeatTimer);
	clearInterval(beeperTimer);
	clearInterval(redLEDFlash);
	clearInterval(greenLEDFlash);
	doseStageNum = 0;
	changeStatus('Powered Off');
}

function flashLCD(number,limit){
	flashCounter = 0;
	turnOffLCD();
	flashTimer = setInterval(function(){
		if(flashCounter < limit){
			segmentToggle(digits[Math.floor(number/10)],'tens');
			segmentToggle(digits[number%10],'ones');
			flashCounter++;
		}
		else{
			clearInterval(flashTimer);
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
	walkPatternTimer = setInterval(function(){
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
	},3400);
}

function setReadyMode(){
	//changeStatus('Current mode: Ready');
	turnOffAllLED();
	flashGreenLED(500,3000);
	setLCDNum(doseCount);
	doseLockout = false;
	clearInterval(flashTimer);
	clearInterval(walkPatternTimer);
	clearInterval(doseRepeatTimer);
	clearInterval(beeperTimer);
}

function setDose(){
	doseLockout = true;
	turnOffLCD();
	turnOffAllLED();
	playAudio(pgBeeperLong); // $beeperLong.play();
	flashGreenLED(400,800);
	walkLCD();
	var doseRepeatTimer = setInterval(function(){
		walkLCD();
	},5600);
	var doseTimer = setTimeout(function(){
		clearInterval(doseRepeatTimer);
		doseCount++;
		setReadyMode();
		$doseNumber.val(doseCount);
	},20000)
}

function setPoorskin(){
	doseLockout = true;
	turnOffAllLED();
	flashRedLED(400,800);
	var beeperCounter = 0;
	playAudio(pgBeeperLong); // $beeperLong.play();
	setTimeout(function(){
		playAudio(pgBeeper); // $beeper.play();
	},900);
	beeperTimer = setInterval(function(){
		playAudio(pgBeeperLong); // $beeperLong.play();
		setTimeout(function(){
			playAudio(pgBeeper); // $beeper.play();
		},900);
		if(beeperCounter >= 6){
			clearInterval(beeperTimer);
			setTimeout(function(){ setReadyMode() }, 1000);
		}
		else beeperCounter++;
	},2400);
}

function setEOU(){
	turnOffAllLED();
	turnOffLCD();
	setLCDNum(80);
	flashLCD(80,100000);
}

function setEOL(){
	turnOffAllLED();
	turnOffLCD();
	setLCDNum(17);
	flashLCD(17,100000);
	flashRedLED(500,1000);
	var beepCounter = 0;
	beeperTimer = setInterval(function(){
		setTimeout(function(){
			if(beepCounter<=4) playAudio(pgBeeper); // $beeper.play();
			else beepCounter = 0;
		},150);
		beepCounter++;
	},750);
}

function doseModeEnter(stage){
	console.log('entering dose mode stage: '+stage);
	changeStatus('Current mode: '+stage);
	if(stage == 'Dose 1' || stage == 'Dose 2' || stage == 'Normal Operation'){
		setDose();
	}
	else if(stage == 'Poor Skin 1' || stage == 'Poor Skin 2'){
		setPoorskin();
	}
	else if(stage == 'EOU'){
		setEOU();
	}
	else if(stage == 'EOL'){
		clearInterval(beeperTimer);
		clearInterval(flashTimer);
		setReadyMode();
		setEOL();
	}
	else if (stage =='Power Off'){
		powerDown();
	};
	doseStageNum++;
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

function flashRedLED(ontime,offtime){
	if(powered){
		redLEDFlash = setInterval(function(){
			$redLED.removeClass('hidden');
			setTimeout(function(){
				$redLED.addClass('hidden');
			},ontime);
		},offtime);
	}
}


function turnOffAllLED(){
	clearInterval(greenLEDFlash);
	clearInterval(redLEDFlash);
}