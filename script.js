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
var $contextArrowContainer = $('.contextArrowContainer');
var $deviceContent = $('.device');
var isFullScreen, contextSize;
var moveDistance = 0;
var tempContentStyle;
var tempArrowStyle;
var contextOpen = false;
var $debugLog = $('.debugLog');
var $testSlideButton = $('#testSlide');

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
    var path = window.location.pathname;
    path = path.substr(0, path.length-10);
    url = path+url;
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
	statusBar.hide();
}, false);

$(document).ready(function(){
	adjustContentSpacing('section');
	$powerButtonOff.hide();

	//functions for description text
	console.log(document.styleSheets[0]);
	var sheet = (function(){
		var style = document.createElement("style");
		style.appendChild(document.createTextNode(""));
		document.head.appendChild(style);
		return style.sheet;
	})();

	isFullScreen = window.matchMedia("(min-width: 900px)").matches;
	if(isFullScreen){
		$contextContent.addClass('notransition');
		var contentWidth = $contextContent.outerWidth();
		//$contextContent.css({'left':-$contextContent.outerWidth()});
		tempContentStyle = setStyle('.contextContent{left:'+-$contextContent.outerWidth()+'px}');
		tempArrowStyle = setStyle('.contextArrow.slideRight{left:'+contentWidth+'px}');
		setTimeout(function(){$contextContent.removeClass('notransition');},50);
	}
	else{
		// $contextContent.css({'top':-$contextContent.outerHeight()});
		// tempContentStyle = setStyle('.contextContent{top:'+-$contextContent.outerHeight()+'px}');
		tempContentStyle = setStyle('.contextContent{top:0px}');
		console.log($contextContent.outerHeight());
	}

	$contextArrow.on('tap',function(){
		isFullScreen = window.matchMedia("(min-width: 900px)").matches;
		
		// $('.contextContent.slideDown').css('min-height',contextSize);
		// moveDistance = (moveDistance == 0) ? contextSize : 0;
		if(isFullScreen){
			$contextContent.toggleClass('slideRight');
			$contextArrow.toggleClass('slideRight');
			$contextArrow.toggleClass('contextArrowClosed').toggleClass('contextArrowOpen');
		}
		else{
			$contextContent.addClass('docked');
			contextSize = (isFullScreen) ? $contextContent.outerWidth() : $contextContent.outerHeight();
			$debugLog.html(contextSize);
			$contextContent.removeClass('docked');
            //sheet.addRule('.contextContent.slideDown','min-height: '+(contextSize+20)+'px;',0);
            console.log($contextContent.css('height'));
            if($contextContent.css('height') == '0px')
                sheet.insertRule('.contextContent.slideDown{min-height: '+(contextSize+20)+'px !important;}',0);
            else
                sheet.removeRule(0);
			// tempContentStyle = setStyle('.contextContent.slideDown{min-height:'+contextSize+'px}');
			// setStyle(tempContentStyle);
			// if ($contextContent.css('min-height') == 0)  $slideDown.css('min-height',contextSize);
			// else $slideDown.css('min-height','');
			$contextContent.toggleClass('slideDown');
			$contextArrow.toggleClass('slideDown');
			$contextArrow.toggleClass('contextArrowClosed').toggleClass('contextArrowOpen');
		};
		
	})

	$testSlideButton.on('tap',function(){
		$contextContent.toggleClass('slideRight');
	});

	$display.find('*').addClass('digitOff');

	$powerButton.on('tap',function(){
		if(!powered){
			powerUp();
		};
	})

	$powerButtonOff.on('tap',function(){
		if(powered){
			powerDown();
		};
	})

	$testSoundPG.on('tap',function(){
		playAudio('beep.mp3');
	})

	$poorSkinButton.on('tap',function(){
		if(powered) doseModeEnter('Poor Skin 1');
	})

	$EOUButton.on('tap',function(){
		if(powered) doseModeEnter('EOU');
	})

	$EOLButton.on('tap',function(){
		if(powered) doseModeEnter('EOL');
	})

	$flashButton.on('tap',function(){
		if(powered) flashLCD(88,9);
	});

	$walkButton.on('tap',function(){
		if(powered) walkLCD();
	});

	$doseUpButton.on('tap',function(){
		if(powered && !doseLockout) setDose();
	});

	$readyButton.on('tap',function(){
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

	$logoCircle.on('tap',function(){
		$extraButtons.toggleClass('hidden');
	});

	$doseButton.on('touchstart mousedown',function(e){
		e.preventDefault();
		$doseButton.addClass('doseButtonPressed');
		usingPhonegap ? playAudio(buttonPressPG) : $buttonPress.play();
	});
	$doseButton.on('touchend mouseup touchcancel',function(e){
		e.preventDefault();
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
	clearTimeout(timer);
	timer=setTimeout(function(){
		adjustContentSpacing('section');
		setStyle('',tempArrowStyle);
		setStyle('',tempContentStyle);
		isFullScreen = window.matchMedia("(min-width: 900px)").matches;
		// contextSize = (isFullScreen) ? $contextContent.outerWidth() : $contextContent.outerHeight();
		if(isFullScreen){
			$contextContent.add($contextArrow).addClass('notransition');
			$contextArrow.addClass('contextArrowClosed').removeClass('contextArrowOpen');
			tempContentStyle = setStyle('.contextContent{left:'+-$contextContent.outerWidth()+'px}');
			tempArrowStyle = setStyle('.contextArrow.slideRight{left:'+$contextContent.outerWidth()+'px}');
			setTimeout(function(){$contextContent.add($contextArrow).removeClass('notransition');},50);
		}
		else{
			// $contextContent.css({'top':-$contextContent.outerHeight()});
			$contextArrow.addClass('contextArrowClosed').removeClass('contextArrowOpen');
			tempContentStyle = setStyle('.contextContent{top:0px}');
		}
	},100)

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

function setStyle(cssText) {
    var sheet = document.createElement('style');
    sheet.type = 'text/css';
    /* Optional */ window.customSheet = sheet;
    (document.head || document.getElementsByTagName('head')[0]).appendChild(sheet);
    return (setStyle = function(cssText, node) {
        if(!node || node.parentNode !== sheet)
            return sheet.appendChild(document.createTextNode(cssText));
        node.nodeValue = cssText;
        return node;
    })(cssText);
};