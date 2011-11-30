$(document).ready(function() {
	
	// Determine the protocol
	var protocol = ('https:' == document.location.protocol ? 'https' : 'http');

	// *** PRESET OPTIONS HERE ***
	var options = {
		// You can find your Planbox initiative token on the Manage page
		// Instructions: http://www.planbox.com/help/user_feedback
		planboxToken: '<TOKEN'>,
		
		// You can forward any incoming feedback to an email
		// Keep empty not to. Only a single email is allowed.
		forwardEmail: '',
		
		// You can set the page URL. If empty will use window.location.href
		pageUrl: '',
		
		// You can specify a human readable page title
		pageTitle: '',
		
		// The button appears center-left by default. Modify in CSS.
		// It is an image you can modify here.
		buttonImageSrc: protocol+'://www.planbox.com/img/feedback_button.png',
		buttonImageAlt: 'Feedback',
		buttonTooltip: 'Send us Feedback',
		
		// When you click on the button it opens a dialog
		dialogTitle: 'User Feedback',
		dialogCloseTooltip: 'Close dialog',
		dialogEmailLabel: 'Your email',
		dialogFeedbackLabel: 'Your feedback',
		dialogCancelText: 'Cancel',
		dialogSubmitText: 'Submit',
		
		// You can prefill the email
		dialogEmail: '',
		
		// When the user clicks on Submit, do some validation
		// and tell the user what's happening
		emailIsRequired: true,
		emailInvalidError: 'Please provide a valid email',
		feedbackMissingError: 'Please type in feedback',
		feedbackAjaxSuccess: 'We have received your feedback. Thank you!',
		feedbackAjaxError: 'There was an error.'
	};
	
	// *** CHANGE OPTIONS AFTER ***
	// Make options available as a global variable so you
	// can modify any option on the fly. For example
	// this prefills the email input:
	//   window.FeedbackOptions.dialogEmail = 'john@example.com';
	window.FeedbackOptions = options;
	
	// Create the button and hide it
	var button_em = $('<div id="feedback_button">').appendTo('body').hide();
	button_em.attr('title', options.buttonTooltip);
	$('<img src="'+options.buttonImageSrc+'" alt="Feedback" />').appendTo(button_em);
	
	// Extend the button if hovered
	button_em.hover(
		function() {
			$(this).stop().animate({paddingLeft:'5'});
		},
		function() {
			$(this).stop().animate({paddingLeft:'0'});
		}
	);
	
	// Show the feedback dialog when the button is clicked
	button_em.click(function(e) {
		// Create a dialog
		var mask_em = $('<div id="feedback_mask">').appendTo('body');
		var dialog_em = $('<div id="feedback_dialog">').appendTo('body');
		
		// Header of the dialog
		var header_em = $('<div class="header">').appendTo(dialog_em);
		header_em.text(options.dialogTitle);
		var close_em = $('<a href="#" class="close" title="'+options.dialogCloseTooltip+'">&times;</a>').appendTo(header_em);
		
		// Allow drag and drop of the dialog through its header
		header_em.mousedown(function(e) {
			var pos = dialog_em.position();
			if (e.target == close_em[0]) return false;
			header_em.data('dnd', {
				mouseX: e.clientX,
				mouseY: e.clientY,
				elX: pos.left,
				elY: pos.top
			});
			$(document).bind('mouseup.dialog_dnd', function(e) {
				$(this).unbind('.dialog_dnd');
				header_em.removeData('dnd');
				return false;
			});
			$(document).bind('mousemove.dialog_dnd', function(e) {
				var dnd = header_em.data('dnd');
				if (!dnd) return true;
				dialog_em.css({
					left: dnd.elX + (e.clientX - dnd.mouseX),
					top: dnd.elY + (e.clientY - dnd.mouseY)
				});
				if (options.onresize) options.onresize.apply(dialog_em);
				return false;
			});
			return true;
		});
		// Prevent text selection in header
		header_em.bind('selectstart', function(e) {
			return false;
		});
		
		// Content
		var tabindex = 100;
		var content_em = $('<div class="content"></div>').appendTo(dialog_em);
		
		// Email input
		$('<label>'+options.dialogEmailLabel+'</label>').appendTo(content_em);
		var email_em = $('<input class="email" type="text" tabindex="'+(tabindex++)+'" value="'+options.dialogEmail+'"/>').appendTo(content_em);
		
		// Feedback textarea
		$('<label>'+options.dialogFeedbackLabel+'</label>').appendTo(content_em);
		var feedback_em = $('<textarea class="feedback" tabindex="'+(tabindex++)+'"></textarea>').appendTo(content_em);
		
		// AJAX message
		var ajax_em = $('<p class="ajax">&nbsp;</p>').appendTo(content_em);
		

		// Function to hide the dialog
		var _hide = function(e) {
			$(document).unbind('.feedback_dialog');
			dialog_em.remove();
			mask_em.remove();
			return false;
		};
		
		// Function to submit the feedback to Planbox
		var _submit = function(e) {
			ajax_em
				.stop(true, true)
				.removeClass('error ok')
				.empty();
			
			// If email is required and not passed or invliad, show
			// an error message and eventually make it disapear
			var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
			var email = $.trim(email_em.val());
			if ((options.emailIsRequired && email.length == 0) ||
				(email.length > 0 && !re.test(email))) {
				ajax_em
					.addClass('error')
					.html(options.emailInvalidError)
					.delay(3000).fadeOut(1000, function() {
						$(this).empty().show();
					});
				return false;
			}
			
			// If feedback is not passed, show an error message and
			// eventually make it disapear
			var feedback = $.trim(feedback_em.val());
			if (feedback.length == 0) {
				ajax_em
					.addClass('error')
					.html(options.feedbackMissingError)
					.delay(3000).fadeOut(1000, function() {
						$(this).empty().show();
					});
				return false;
			}
			
			// Send the feedback
			$.post(protocol+'://www.planbox.com/api/feedback', {
				token: options.planboxToken,
				feedback: feedback,
				user_email: email,
				forward_email: options.forwardEmail,
				page_title: (options.pageTitle && options.pageTitle.length)?options.pageTitle:'',
				page_url: (options.pageUrl && options.pageUrl.length)?options.pageUrl:window.location.href
				}, function(data) {
					if (data && data.code) {
						if (data.code == 'ok') {
							ajax_em.addClass('ok').html(options.feedbackAjaxSuccess);
						} else  {
							ajax_em.addClass('error').html(options.feedbackAjaxError+' '+message);
						}
					} else {
						ajax_em.addClass('error').html(options.feedbackAjaxError);
					}
				}, 'json'
			);
			
			return false;
		};
		
		
		// Button pane
		var buttons_em = $('<div class="buttons"></div>').appendTo(dialog_em);
		
		// Powered by Planbox
		$('<a class="powered_by_planbox" href="http://www.planbox.com" target="_blank"><img src="'+protocol+'://www.planbox.com/img/powered_by_planbox.png" alt="Powered by Planbox" /></a>').appendTo(buttons_em);
		
		// Apply button
		var apply_em = $('<a class="fr button apply" href="#" tabindex="'+(tabindex+2)+'">'+options.dialogSubmitText+'</a>').appendTo(buttons_em);
		apply_em.click(_submit);
		apply_em.keydown(function(e) {
			if (e.keyCode == 13) return _submit(e);
			return true;
		});
		
		// Cancel button
		var cancel_em = $('<a class="fr no_button cancel" href="#" tabindex="'+(tabindex+1)+'">'+options.dialogCancelText+'</a>').appendTo(buttons_em);
		cancel_em.click(_hide);
		cancel_em.keydown(function(e) {
			if (e.keyCode == 13) return _hide();
			return true;
		});
		
		
		// Show the mask and dialog
		mask_em.show();
		dialog_em.show();
		close_em.click(_hide);
		
		// Position the dialog in the center and show
		var windowWidth = $(window).width();
		var windowHeight = $(window).height();
		var x = Math.round($(document).scrollLeft() + $(window).width()/2 - dialog_em.width()/2);
		var y = Math.round($(document).scrollTop() + $(window).height()/2 - dialog_em.height()/1.5);
		if (x < 10) x = 10;
		if (y < 100) y = 100;
		dialog_em.css({'left': x, 'top': y});
			
		// Bind Esc to close dialog
		$(document).bind('keydown.feedback_dialog', function(e) {
			if (e.keyCode == 27) {
				e.stopImmediatePropagation();
				return _hide(e);
			}
			return true;
		});
		
		return false;
	});
	
	// Show the button
	button_em.show();
});