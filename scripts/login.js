$(document).ready(() => {

    $('#generate').on("click", function(e) {
        let passwordHtml = '<div class="form-outline mb-4">\n' +
            '<input type="email" id="form2Example11" class="form-control"\n' +
            'placeholder="XXXXXXXX" />\n' +
            '<label class="form-label" for="form2Example11">One time code</label>\n' +
            '</div>'
        $(this).parent().before(passwordHtml);
        $('#username').attr("disabled", "disabled")
        $('#phone').attr("disabled", "disabled")
        $('#login').removeClass('d-none');
        $(this).addClass('d-none');
        $(this).parent().remove()
    })

    $('#login').on("click", function(e){
        window.location.href='?prefix=group_therapy_sms&page=pages%2Fhome&pid=16'
    });
})