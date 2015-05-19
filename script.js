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
var $infoButton = $('#infoToggle');
var $deviceStatus = $('#deviceStatus');
var $testSoundPG = $('#testSoundPG');
var $testSound = $('#testSound');

var $workingAssembly = $('.workingAssembly');
var $packageAssembly = $('.packageAssembly');
var $topAssy = $('.topAssy');
var snappedIn = false;

var infoPageShowing = false;
var $infoPage = $('.infoPage');
var $safetyInfoPage = $('.safetyInfoPage');
var $controlBlocker = $('.controlButtonsBlocker');
var $controlButtonBlocker = $('.controlButtonBlocker');
var $ionsysLogoBanner = $('.ionsysLogoBanner');
var buttonStatus = [false, false, false, true];
var noButtonFunction = true;

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
var doseLockout = true;
var pscLockout = false;
var eolLockout = false;
var eouLockout = false;
var doseCount = 0;
var prevDose = 0;
var greenLEDFlash, redLEDFlash;
var beeperTimer, flashTimer, timer, doseRepeatTimer, walkTimer, walkPatternTimer, doseTimer, doseRepeatTimer;

//description animations
var $contextContent = $('.contextContent');
var $contextArrow = $('.contextArrow');
var $contextArrowContainer = $('.contextArrowContainer');
var $deviceContent = $('.device');
var $modeCaption = $('#modeCaption');
var isFullScreen, contextSize;
var tempContentStyle;
var tempArrowStyle;
var contextOpen = false;
var $debugLog = $('.debugLog');
var $testSlideButton = $('#testSlide');
var sheet = (function(){
	var style = document.createElement("style");
	style.appendChild(document.createTextNode(""));
	document.head.appendChild(style);
	return style.sheet;
})();

//phonegap specific
var beeperPG = document.getElementById('beeper').getAttribute('src');
var beeperLongPG = document.getElementById('beeper-long').getAttribute('src');
var buttonPressPG = document.getElementById('button-press').getAttribute('src');
var usingPhonegap = false;
var usingPhonegapAudio = false;
var $phonegapBlack = $('.phonegapBlack');

//arrays for the LCD display
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

//pattern of unit/segment to "walk" the LCD display around the edges
var walkpattern = [['ones','a'],['ones','b'],['ones','c'],['ones','d'],['tens','d'],
	['tens','e'],['tens','f'],['tens','a']];

//order of modes for demo unit (HCP functionality)
//var doseStage = ['Dose 1','Dose 2','Poor Skin 1','Poor Skin 2','EOU','EOL','Power Off'];
var doseStageTemp = ['ready', 'dose1','dose2','psc1','psc2','eou','eol','poweroff','poweredoff','poweron'];
var doseStageNum = 0;

function getWindowHeight(){
	return $(window).height();
}

function adjustContentSpacing(currSection) {
	var windowHeight = getWindowHeight();
	$(currSection).css({'min-height':windowHeight-70});
}

function adjustContentOffset(currSection,num) {
	var windowHeight = getWindowHeight();
	currSection.css({'top':windowHeight+num});
}

//audio file play function for PhoneGap only (otherwise default to jQuery play())
function playAudio(url) {
    // Play the audio file at url
    var path = window.location.pathname;
    path = path.substr(0, path.length-10);
    url = path+url;
    var my_media = new Media(url,
        // success callback
        function () {
        },
        // error callback
        function (err) {
        }
    );
    // Play audio
    my_media.play();
    setTimeout(function(){my_media.release();},1000)
}

function scrollAndStop(marker,offset){
	var scrollOffset;
	scrollOffset = $(marker).offset().top - offset;
	$('html,body').stop().animate({scrollTop : scrollOffset},400);
}

//run phonegap specific functions (this only fires in PhoneGap)
document.addEventListener("deviceready", function(){
	usingPhonegap = true;
	// if(parseInt(device.version) <= 8 ){
	// 	usingPhonegapAudio = true;
	// };
	setTimeout(function(){
		navigator.splashscreen.hide()
		statusBar.hide();
		$phonegapBlack.addClass('phonegapBlackFadeOut');
		setTimeout(function(){
			$phonegapBlack.addClass('hidden');
		},1500);
	},1000);
}, false);

$topAssy.draggable({/*axis:"x",*/ 
	 snap: ".bottomAssySnapPoint",
	 snapTolerance: 30,
	 snapMode: 'inner',
	 containment: ".splash",
	 stop: function(event, ui){
	 	var snapped = $(this).data('ui-draggable').snapElements;
	 	var snappedTo = $.map(snapped, function(element){
	 		return element.snapping ? element.item : null;
	 	});
	 	var result= '';
        $.each(snappedTo, function(idx, item) {
            result += $(item).attr('class');
        });
        if(result == 'bottomAssySnapPoint')
        {
        	$packageAssembly.addClass('hidden');
        	var leftOffset = $topAssy.css('left');
        	$topAssy.removeAttr('style');
        	$topAssy.css({'left':leftOffset});
        	setTimeout(function(){
        		if(!isFullScreen) $('body').css({'padding-bottom':'8em'});
        		$workingAssembly.removeClass('hidden');
        		$('.context').removeClass('invisible');
        	},25);
        	setTimeout(function(){
        		slideContext();
        	},200);
        	snappedIn = true;
        	if(!powered){
				powerUp();
			};
        }
	}
});

$(document).ready(function(){
	//set the BG image / div size to fill screen
	if(!usingPhonegap){
			setTimeout(function(){
			$phonegapBlack.addClass('phonegapBlackFadeOut');
			setTimeout(function(){
				$phonegapBlack.addClass('hidden');
			},1500);
		},500); // normal
	};
	$powerButtonOff.hide();
	//phonegap splashscreen hide;
	// navigator.splashscreen.hide()

	//functions for description text
	adjustContentSpacing('section');
	adjustContentOffset($infoPage,100);
	

	isFullScreen = window.matchMedia("(min-width: 900px)").matches;
	if(isFullScreen){
		adjustContentOffset($safetyInfoPage,-100);
		$contextContent.addClass('notransition');
		var contentWidth = $contextContent.outerWidth();
		tempContentStyle = setStyle('.contextContent{left:-377px}');
		tempArrowStyle = setStyle('.contextArrow.slideRight{left:377px}');
		setTimeout(function(){$contextContent.removeClass('notransition');},50);
	}
	else{
		adjustContentOffset($safetyInfoPage,-50);
		tempContentStyle = setStyle('.contextContent{top:0px}');
	}

	//slideout of context description field
	$contextArrow.on('tap',function(){
		slideContext();
	});

	//clear out the LCD display
	$display.find('*').addClass('digitOff');


	//power on/off functions 
	// $powerButton.on('tap',function(){
	// 	if(!powered && snappedIn){
	// 		powerUp();
	// 	};
	// });

	$powerButtonOff.on('tap',function(){
		if(powered){
			powerDown();
		};
	});

	//***** DOSE BUTTON PRESS FUNCTION *****//
	$doseButton.on('touchstart mousedown',function(e){
		e.preventDefault();
		$doseButton.addClass('doseButtonPressed');
		usingPhonegapAudio ? playAudio(buttonPressPG) : $buttonPress.play();
		if(doseStageTemp[doseStageNum] == 'eol' || doseStageTemp[doseStageNum] == 'eou'){
			poweroffTimer = setTimeout(function(){
				setTimeout(function(){
					$doseButton.removeClass('doseButtonPressed');
				},25);
				powerDown();	
			},3000);
		}
	});
	$doseButton.on('touchend mouseup touchcancel',function(e){
		e.preventDefault();
		setTimeout(function(){
			$doseButton.removeClass('doseButtonPressed');
		},25);
		if(doseStageTemp[doseStageNum] == 'eol' || doseStageTemp[doseStageNum] == 'eou') clearTimeout(poweroffTimer);
		if(powered && !doseLockout){
			if (doseButtonFirstPress && (doseStageTemp[doseStageNum] == 'dose1' || doseStageTemp[doseStageNum] == 'ready')){
				doseStageNum = 1;
				doseModeEnter('dose1');
				doseButtonFirstPress = false;
			}
			else{
				setTimeout(function(){ doseButtonFirstPress = true; }, 200);
				setTimeout(function(){ doseButtonFirstPress = false;}, 3000);
			};
		};
	});


	$poorSkinButton.on('tap',function(e){
		e.preventDefault();
		if(powered && !noButtonFunction){
			doseStageNum = 3;
			doseModeEnter('psc1');
		}
	});

	$EOUButton.on('tap',function(e){
		e.preventDefault();
		if(powered && !noButtonFunction){
			doseStageNum = 5;
			doseModeEnter('eou');
		};
	});

	$EOLButton.on('tap',function(e){
		e.preventDefault();
		if(powered && !noButtonFunction){
			prevDose = doseStageNum;
			doseStageNum = 6;
			doseModeEnter('eol');	
		} 
	});

	$infoButton.on('tap',function(e){
		e.preventDefault();
		infoPageSlide();
	});

	$safetyInfoPage.on('tap',function(e){
		e.preventDefault();
		if(!$safetyInfoPage.hasClass('slideUp')){
			$safetyInfoPage.addClass('slideUp');
			$ionsysLogoBanner.removeClass('hiddenLogo');
		}
		else{
			$safetyInfoPage.removeClass('slideUp');
			if(!$infoPage.hasClass('slideUp')) $ionsysLogoBanner.addClass('hiddenLogo');
		}
		isFullScreen ? adjustContentOffset($safetyInfoPage,-100) : adjustContentOffset($safetyInfoPage,-50);
		scrollAndStop('body',0);
	});

	$doseNumber.change(function(){
		var number = parseInt($doseNumber.val(),10);
		if(powered){
			setLCDNum(number);
			doseCount = number;
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
		if(isFullScreen){
			$contextContent.add($contextArrow).addClass('notransition');
			$contextArrow.addClass('contextArrowClosed').removeClass('contextArrowOpen');
			tempContentStyle = setStyle('.contextContent{left:'+-$contextContent.outerWidth()+'px}');
			tempArrowStyle = setStyle('.contextArrow.slideRight{left:'+$contextContent.outerWidth()+'px}');
			setTimeout(function(){$contextContent.add($contextArrow).removeClass('notransition');},50);
		}
		else{
			$workingAssembly.removeClass('hidden');
			$packageAssembly.addClass('hidden');
			setTimeout(function(){$('.context').removeClass('invisible');},1);
			$contextArrow.addClass('contextArrowClosed').removeClass('contextArrowOpen');
			tempContentStyle = setStyle('.contextContent{top:0px}');
		}
	},100)

})

function changeDescription(description,custom){
	if(custom){
		changeStatus(description);
	}
	else{
		for (var i=0; i<doseStageTemp.length; i++){
			if (doseStageTemp[i] == description.toString().toLowerCase()){
				var path = ('.status'+doseStageTemp[i][0].toUpperCase()+doseStageTemp[i].slice(1));
				$contextContent.fadeTo('slow',0,function(){
					$('.contextContent p').removeClass('enable');
					$(path).addClass('enable');
					$contextContent.addClass('docked'); //hide context but keep it finite so you can grab its size
					resizeContext(0);
					resizeContext($contextContent.outerHeight());
					$contextContent.removeClass('docked');
				});
				$contextContent.fadeTo('slow',1);
				break;
			}
		};
	}

}

function changeStatus(status){
	$deviceStatus.fadeOut('fast',function() {
		$('#deviceStatus p').removeClass('enable');
		$('#deviceStatus .statusCustom').html(status).addClass('enable');
	});
	$deviceStatus.fadeIn('fast');
}

function slideContext(){
	isFullScreen = window.matchMedia("(min-width: 900px)").matches;
	if(isFullScreen){
		//************* need to do a true check for case of toggled or not to get arrow orientation right
		$contextContent.toggleClass('slideRight');
		$contextArrow.toggleClass('slideRight');
		$contextArrow.toggleClass('contextArrowClosed').toggleClass('contextArrowOpen');
	}
	else{
		$contextContent.addClass('docked');
		contextSize = (isFullScreen) ? $contextContent.outerWidth() : $contextContent.outerHeight();
		$debugLog.html(contextSize);
		$contextContent.removeClass('docked');
	    if($contextContent.css('height') == '0px')
	    	resizeContext(contextSize);
	        //sheet.insertRule('.contextContent.slideDown{min-height: '+(contextSize+20)+'px !important;}',0);
	    else
	        sheet.removeRule(0);
		$contextContent.toggleClass('slideDown');
		$contextArrow.toggleClass('slideDown');
		$contextArrow.toggleClass('contextArrowClosed').toggleClass('contextArrowOpen');
	};
		
}

//still have issue of div not shrinking ; grows fine
//this resizes the context description to fit if the text inside expands past its bounds (vertical layout)
function resizeContext(size){
	try{
		sheet.removeRule(0);
	}
	catch(e){console.log(e);/*dont do anything, this is expected for initial case*/};
	sheet.insertRule('.contextContent.slideDown{min-height: '+(size)+'px !important;}',0);
}

function powerUp(){
	// changeDescription('Powering On...',true);
	changeDescription('poweron');
	//make this pulsing conditional if the device is web?
	$powerButtonOff.fadeIn('fast',function(){buttonPulse($powerButtonOff);});
	flashCounter = 0;
	usingPhonegapAudio ? playAudio(beeperPG) : $beeper.play();
	redLEDFlash = setTimeout(function(){
		$redLED.removeClass('hidden');
		setTimeout(function(){
			$redLED.addClass('hidden');
			// changeDescription('Mode: POST',true);
			flashLCD(88,9);
		},500);
	},500);
	powered = true;
	setTimeout(function(){
		flashGreenLED(500,3000);
		setTimeout(function(){
			doseModeEnter('ready');
			doseLockout = false;
			setTimeout(function(){$modeCaption.removeClass('hidden')},600);
		},2000);
	},4000);
}

function buttonPulse(button){
	//done through CSS animation
	button.addClass('buttonPulse');
}

function removePulse(button){
	button.removeClass('buttonPulse');
}

function powerDown(){
	$powerButtonOff.fadeOut(500);
	powered = false;
	doseCount = 0;
	clearInterval(flashTimer);
	try{
		clearTimeout(doseTimer);
	} catch(e){};
	clearInterval(beeperTimer);
	clearWalkTimer();
	turnOffLCD();
	turnOffAllLED();
	setButtons(false,false,false)
	doseStageNum = 0;
	eolLockout = false;
	eouLockout = false;
	pscLockout = false;
	noButtonFunction = true;
	removePulse($poorSkinButton);
	removePulse($EOUButton);
	removePulse($EOLButton);
	//changeStatus('Powered Off');
	if(!isFullScreen) $('body').css({'padding-bottom':0});
	changeDescription('poweredoff');
	slideContext();
	setTimeout(function(){
		$workingAssembly.addClass('hidden');
		$('.context').addClass('invisible');	
	},450);
	setTimeout(function(){	
		$packageAssembly.removeClass('hidden');
	},1000);
	setTimeout(function(){
		$topAssy.addClass('reset');
		setTimeout(function(){$topAssy.removeClass('reset');},450);
		$topAssy.removeAttr('style');
		snappedIn = false;
	},1200);
}

function flashLCD(number,limit){
	flashCounter = 0;
	turnOffLCD();
	clearInterval(flashTimer);
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
	},240);
	walkTimer = setTimeout(function(){
		clearInterval(walkPatternTimer);
		setLCDNum(doseCount);
	},4000);
}

function setReadyMode(){
	turnOffAllLED();
	flashGreenLED(500,3000);
	setLCDNum(doseCount);
	doseLockout = false;
	pscLockout = false;
	doseStageNum = 0;
	setButtons(false,true,true);
	noButtonFunction = false;
	if($infoPage.hasClass('slideUp')){
		setButtons(false,false,false,true);
		noButtonFunction = true;
	}
	removePulse($poorSkinButton);
	changeDescription('ready');
	clearInterval(flashTimer);
	clearInterval(walkPatternTimer);
	clearInterval(doseRepeatTimer);
	clearInterval(beeperTimer);
}

function setDose(){
	doseLockout = true;
	changeDescription('dose1');
	turnOffLCD();
	turnOffAllLED();
	setButtons(true,true,true);
	usingPhonegapAudio ? playAudio(beeperLongPG) : $beeperLong.play();
	flashGreenLED(250,500);
	walkLCD();
	doseRepeatTimer = setInterval(function(){
		walkLCD();
	},6000);
	doseTimer = setTimeout(function(){
		clearInterval(doseRepeatTimer);
		doseCount++;
		$doseNumber.val(doseCount);
		if(doseCount == 80){
			setReadyMode();
			setTimeout(doseModeEnter('eou'),10);
		}
		else setReadyMode();
	},18000)
}

function setPoorskin(){
	if(doseLockout){
		pscLockout = true;
		changeDescription('psc1');
		turnOffAllLED();
		turnOffLCD();
		setButtons(true,false,false);
		buttonPulse($poorSkinButton);
		setLCDNum(doseCount);
		clearInterval(doseTimer);
		clearWalkTimer();
		flashRedLED(250,500);
		var beeperCounter = 0;
		usingPhonegapAudio ? playAudio(beeperLongPG) : $beeperLong.play();
		setTimeout(function(){
			usingPhonegapAudio ? playAudio(beeperPG) : $beeper.play();
		},900);
		beeperTimer = setInterval(function(){
			usingPhonegapAudio ? playAudio(beeperLongPG) : $beeperLong.play();
			setTimeout(function(){
				usingPhonegapAudio ? playAudio(beeperPG) : $beeper.play();
			},900);
			if(beeperCounter >= 6){
				clearInterval(beeperTimer);
				setTimeout(function(){ setReadyMode() }, 1000);
			}
			else beeperCounter++;
		},2400);
	}
}

function setEOU(){
	eouLockout = true;
	changeDescription('eou');
	turnOffAllLED();
	endDoseEarly();
	clearWalkTimer();
	turnOffLCD();
	setButtons(false, true, true);
	buttonPulse($EOUButton);
	setLCDNum(80);
	flashLCD(80,100000);
}

function setEOL(){
	eolLockout = true;
	changeDescription('eol');
	turnOffAllLED();
	clearWalkTimer();
	endDoseEarly();
	turnOffLCD();
	setButtons(false,false,true);
	buttonPulse($EOLButton);
	if(prevDose == 5) setLCDNum(80);
	else setLCDNum(doseCount);
	flashRedLED(375,750);
	var beepCounter = 0;
	beeperTimer = setInterval(function(){
		setTimeout(function(){
			if(beepCounter<=4){
				usingPhonegapAudio ? playAudio(beeperPG) : $beeper.play();
			}
			else beepCounter = 0;
		},150);
		beepCounter++;
	},750);
}

function doseModeEnter(stage){
	if(stage != 'poweroff'){
	};
	if(stage == 'ready'){
		setReadyMode();
	}
	else if((stage == 'dose1') && !eolLockout){
		setDose();
	}
	else if((stage == 'psc1') && !eolLockout && !pscLockout){
		setPoorskin();
	}
	else if(stage == 'eou' && !eouLockout){
		setEOU();
	}
	else if(stage == 'eol' && !eolLockout){
		clearInterval(beeperTimer);
		clearInterval(flashTimer);
		setEOL();
	}
	else if (stage =='poweroff'){
		//powerDown();
	};
	
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

function disableButton(buttonID){
	if(!$('#'+buttonID)[0].disabled){ $('#'+buttonID)[0].disabled = true};
}

function enableButton(buttonID){
	if($('#'+buttonID)[0].disabled) $('#'+buttonID)[0].disabled = false;
}

function toggleButton(buttonID,explicit){
	if(typeof explicit !== 'undefined') {
		explicit ? enableButton(buttonID) : disableButton(buttonID);
	}
	else{
		if($('#'+buttonID)[0].disabled) enableButton(buttonID);
		else disableButton(buttonID);
	}
}

function setButtons(psc,eou,eol,temp){
	if(temp == 'undefined' || !temp) buttonStatus = [psc, eou, eol, true];
	toggleButton('poorSkin',psc);
	toggleButton('EOU',eou);
	toggleButton('EOL',eol);
}

function infoPageSlide(){
	if($infoPage.hasClass('slideUp')){
		if(!$safetyInfoPage.hasClass('slideUp')) $ionsysLogoBanner.addClass('hiddenLogo');
		setButtons(buttonStatus[0],buttonStatus[1],buttonStatus[2],true);
		noButtonFunction = false;
	}
	else{
		$ionsysLogoBanner.removeClass('hiddenLogo');
		noButtonFunction = true;
		setButtons(false,false,false,true);
	}
	$infoPage.toggleClass('slideUp');
	scrollAndStop('body',0);
}

function enableAllButtons(){
	$('button')[0].disabled = false;
}

function clearWalkTimer(){
	clearInterval(doseRepeatTimer);
	clearInterval(walkTimer);
	clearInterval(walkPatternTimer);
}

function endDoseEarly(){
	clearTimeout(doseTimer);
	clearInterval(doseRepeatTimer);
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