function getWindowHeight(){
	return $(window).height();
}

function adjustContentSpacing(currSection) {
	var windowHeight = getWindowHeight();
	$(currSection).css({'min-height':windowHeight});
};

$(document).ready(function(){
	adjustContentSpacing('section');
});

$(window).resize(function(){
	//find a way to query the value after xx seconds
	// if it has only moved like 50 pixels, then it must
	// be an address ar hide, and DON'T adjust spacing
	adjustContentSpacing('section');
});