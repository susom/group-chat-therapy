<?php

// namespace Stanford\GroupChatTherapy;
/** @var \Stanford\GroupChatTherapy\GroupChatTherapy $module */

?>
<html>
<head>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.0.0/dist/css/bootstrap.min.css" integrity="sha384-Gn5384xqQ1aoWXA+058RXPxPg6fy4IWvTNh0E263XmFcJlSAwiGgFAW/dAiS6JXm" crossorigin="anonymous">
    <script src="https://code.jquery.com/jquery-3.2.1.slim.min.js" integrity="sha384-KJ3o2DKtIkvYIK3UENzmM7KCkRr/rE9/Qpg6aAZGJwFDMVNA/GpGFF93hXpG5KkN" crossorigin="anonymous"></script>
    <script src="https://cdn.jsdelivr.net/npm/popper.js@1.12.9/dist/umd/popper.min.js" integrity="sha384-ApNbgh9B+Y1QKtv3Rn7W3mgPxhU9K/ScQsAP7hUibX39j7fakFPskvXusvfa0b4Q" crossorigin="anonymous"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@4.0.0/dist/js/bootstrap.min.js" integrity="sha384-JZR6Spejh4U02d8jOt6vLEHfe/JQGiRRSQQxSfFWpi1MquVdAyjUar5+76PVCmYl" crossorigin="anonymous"></script>
    <script src="https://code.jquery.com/jquery-3.6.1.slim.min.js" integrity="sha256-w8CvhFs7iHNVUtnSP0YKEg00p9Ih13rlL9zGqvLdePA=" crossorigin="anonymous"></script>

    <script src="https://cdn.jsdelivr.net/npm/datatables@1.10.18/media/js/jquery.dataTables.min.js"></script>
    <link href="https://cdn.jsdelivr.net/npm/datatables@1.10.18/media/css/jquery.dataTables.min.css" rel="stylesheet">
    <?php
    // Insert the JSMO
    $module->injectJSMO();
    ?>


</head>
<body style="background-color: #eee;">
<div class="nav-scroller bg-white box-shadow">
    <nav class="navbar navbar-inverse">
        <div class="container-fluid">
            <div class="navbar-header">
                <a class="navbar-brand" href="#">User Dashboard</a>
            </div>
            <ul class="nav navbar-nav">
                <li class="active"><a href="#">Logout</a></li>
            </ul>
        </div>
    </nav>
</div>
<main role="main" class="container">
    <div class="d-flex align-items-center p-3 text-white-50 bg-purple rounded box-shadow">
        <img class="mr-3" src="https://ctsi-main.sites.medinfo.ufl.edu/files/2017/07/REDCap-App-Icon.png" alt="" width="48" height="48">
        <div class="lh-100">
            <h6 class="mb-0 lh-100">Welcome! User</h6>
            <small>Last Login: 09-09-2011</small>
        </div>
    </div>
    <div class=" p-3 bg-white rounded box-shadow">
        <h6 class="border-bottom border-gray pb-2 mb-0">Ajax Url</h6>
        <div class="media text-muted pt-3">
            <img data-src="holder.js/32x32?theme=thumb&amp;bg=007bff&amp;fg=007bff&amp;size=1" alt="32x32" class="mr-2 rounded" src="data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%2232%22%20height%3D%2232%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2032%2032%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_184caff222c%20text%20%7B%20fill%3A%23007bff%3Bfont-weight%3Abold%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A2pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_184caff222c%22%3E%3Crect%20width%3D%2232%22%20height%3D%2232%22%20fill%3D%22%23007bff%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%2212.296875%22%20y%3D%2216.9%22%3E32x32%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E" data-holder-rendered="true" style="width: 32px; height: 32px;">
            <div class="media-body pb-3 mb-0 small lh-125 border-bottom border-gray">
                <div class="d-flex justify-content-between align-items-center w-100">
                    <?php echo $module->getUrl('pages/test.php',true, true) ?>
<!--                    <strong class="text-gray-dark">Physical Fitness 12/21/22 </strong>-->
                    <a href="?prefix=group_therapy_sms&page=pages%2Fchat&pid=16">View</a>
                </div>
                <div class="d-block">I was able to call `ExternalModules.Stanford.GroupChatTherapy.InitFunction();` from the console on both authenticated and non-authenticated versions of this url - which is good :-)</div>
                <div>I was also able to verify that we can use default php sessions which should allow us to track authenticated clients...</div>
            </div>
        </div>

        <small class="d-block text-right mt-3">
            <a href="#">All Meetings</a>
        </small>
    </div>
    <div>
        <hr>
        <h5>Table of Actions</h5>
        <table id="example" class="display" style="width:100%">
            <thead>
            <tr>
                <th>LogID</th>
                <th>Timestamp</th>
                <th>Record</th>
                <th>Payload</th>
<!--                <th>Expiry TS</th>-->
<!--                <th>Number</th>-->
<!--                <th>Status</th>-->
<!--                <th>Current Field</th>-->
<!--                <th>Last Response TS</th>-->
            </tr>
            </thead>
        </table>

        <br/>

        <div>
            <div class="btn btn-danger btn-sm" id="delete_actions">Delete All Actions</div>
        </div>
    </div>
    <div>
        <hr>
        <h5>Add a new actions</h5>
        <div class="input-group mb-3">
            <input type="text" class="form-control" id="payload" placeholder="Payload">
            <div class="input-group-append">
                <button class="btn btn-success" id="save_action">Save</button>
            </div>
        </div>
    </div>
    <div>
        <pre>
<?php
    // var_dump($module->UserSession);
    // var_dump($module->isAuthenticated());
    // $module->UserSession->setParticipantId('P123');
    // // $module->UserSession->setParticipantId('');
    // var_dump($module->isAuthenticated());
    // var_dump($module->UserSession->getSessionId());
    // var_dump($_SESSION);
?>

        </pre>
    </div>
</main>
</body>
</html>
<style>

</style>
<script>
    $(document).ready(function () {
        const module = ExternalModules.Stanford.GroupChatTherapy;

        $('#delete_actions').bind('click', function() {
            let result = window.confirm("Are you sure you want to delete ALL actions?");
            if (result) module.deleteActions();
            // Refresh table
            module.getActions();
        });

        module.getActions();


        $('#save_action').bind('click', function() {
            let payload = $('#payload').val();
            let result = module.addAction(payload);

            // refresh table
            if (result) module.getActions();
        });


    });
</script>
