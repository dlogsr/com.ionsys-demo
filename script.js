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
var $testSoundPG = $('#testSoundPG');

var $doseNumber = $('#doseNumber');
var $display = $('.seven-segment');
var $greenLED = $('.ledGreen');
var $redLED = $('.ledRed');
var $beeper = $('#beeper')[0];
var $beeperLong = $('#beeper-long')[0];
var $buttonPress = $('#button-press')[0];
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

//description animations
var $contextContent = $('.contextContent');
var $contextArrow = $('.contextArrow');
var $deviceContent = $('.device');

//phonegap specific
var beeperPG = document.getElementById('beeper').getAttribute('src');
var beeperLongPG = document.getElementById('beeper-long').getAttribute('src');
var buttonPressPG = document.getElementById('button-press').getAttribute('src');
var usingPhonegap = false;

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

function adjustContentSpacing(currSection) {
	var windowHeight = getWindowHeight();
	$(currSection).css({'min-height':windowHeight});
}

function playAudio(url) {
    // Play the audio file at url
    url = '/android_asset/www/'+url;
    var my_media = new Media(url,
        // success callback
        function () {
            console.log("playAudio():Audio Success");
        },
        // error callback
        function (err) {
            console.log("playAudio():Audio Error: " + err);
        }
    );
    // Play audio
    my_media.play();
    setTimeout(function(){my_media.release();},1000)
}

document.addEventListener("deviceready", function(){
	usingPhonegap = true;
}, false);

$(document).ready(function(){
	adjustContentSpacing('section');
	$powerButtonOff.hide();

	//functions for description text
	$contextContent.css({'left':-$contextContent.outerWidth()});
	$contextArrow.click(function(){
		if (window.matchMedia("(min-width: 900px)").matches){
			$contextContent.show();
		    $contextContent.animate({
		      left: parseInt($contextContent.css('left'),10) == 0 ?
		        -$contextContent.outerWidth() :
		        0
		    });
		    $('.contextArrowContainer').animate({
		      left: parseInt($contextContent.css('left'),10) != 0 ?
		        $contextContent.outerWidth() :
		        0
		    });
			$contextArrow.toggleClass('contextArrowClosed').toggleClass('contextArrowOpen');
		}
		else{
			$contextContent.slideToggle();
			$contextArrow.toggleClass('contextArrowClosed').toggleClass('contextArrowOpen');
		}

	});

	$display.find('*').addClass('digitOff');

	$powerButton.click('submit',function(){
		if(!powered){
			powerUp();
		};
	})

	$powerButtonOff.click('submit',function(){
		if(powered){
			powerDown();
		};
	})

	$testSoundPG.click('submit',function(){
		playAudio('beep.mp3');
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
			changeStatus('Mode: Ready');
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
		usingPhonegap ? playAudio(buttonPressPG) : $buttonPress.play();
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
	$powerButton.fadeOut('fast', function(){$powerButtonOff.fadeIn();});
	flashCounter = 0;
	usingPhonegap ? playAudio(beeperPG) : $beeper.play();
	redLEDFlash = setTimeout(function(){
		$redLED.removeClass('hidden');
		setTimeout(function(){
			$redLED.addClass('hidden');
			changeStatus('Mode: POST');
			flashLCD(88,9);
		},500);
	},500);
	powered = true;
	setTimeout(function(){
		flashGreenLED(500,3000);
		setTimeout(function(){changeStatus('Mode: Ready')},2000);
	},4000);
}

function powerDown(){
	$powerButtonOff.fadeOut('fast',function(){$powerButton.fadeIn();});
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
	if(number>9)
		segmentToggle(digits[Math.floor(number/10)],'tens',on);
	segmentToggle(digits[number%10],'ones',on);
}

//take in an array of segments to toggle, place (tens or ones), and toggle just those
function segmentToggle(input,place,explicit){ 
	for(var segment in input)
	{
		segmentClass = '.'+input[segment];
		placeClass = '.'+place;
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
	usingPhonegap ? playAudio(beeperLongPG) : $beeperLong.play();
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
	usingPhonegap ? playAudio(beeperLongPG) : $beeperLong.play();
	setTimeout(function(){
		usingPhonegap ? playAudio(beeperPG) : $beeper.play();
	},900);
	beeperTimer = setInterval(function(){
		usingPhonegap ? playAudio(beeperLongPG) : $beeperLong.play();
		setTimeout(function(){
			usingPhonegap ? playAudio(beeperPG) : $beeper.play();
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
			if(beepCounter<=4){
				usingPhonegap ? playAudio(beeperPG) : $beeper.play();
			}
			else beepCounter = 0;
		},150);
		beepCounter++;
	},750);
}

function doseModeEnter(stage){
	changeStatus('Mode: '+stage);
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