<?php

namespace Stanford\GroupChatTherapy;
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
                <a class="navbar-brand" href="#">ASEMLO Test Page</a>
            </div>
            <ul class="nav navbar-nav">
                <li class="active"><a href="#">Logout</a></li>
            </ul>
        </div>
    </nav>
</div>
<main role="main" class="container">
    <div class=" p-3 bg-white rounded box-shadow">
        <h6 class="border-bottom border-gray pb-2 mb-0">Create an Object</h6>
        <div class="media text-muted pt-3">
        </div>
        <small class="d-block text-right mt-3">
            <a href="#">All Meetings</a>
        </small>
    </div>
    <div>
        <hr>
        <h5>Table of Log Objects</h5>
        <table id="example" class="display" style="width:100%">
            <thead>
            <tr>
                <th>LogID</th>
                <th>Timestamp</th>
                <th>Record</th>
                <th>Payload</th>
            </tr>
            </thead>
        </table>

        <br/>

        <div>
            <div class="btn btn-danger btn-sm" id="delete_actions">Delete All Actions</div>
        </div>
    </div>
    <div>
        <pre>
            <?php

            function test1()
            {
                global $module;

                $a = new AsemloTest($module);

                // Test setting a parameter
                $a->setValue('foo', 'bar');
                // var_dump($a);
                $a->save();
                $id = $a->getId();
                echo "ID: $id \n";
                var_dump($a);

                // Test setting a property
                $a->setValue('foo', 'bar2');
                // $a->setValue('record', '123');
                // var_dump($a);
                $a->save();
                //
                // // Test changing a property
                // $a->setValue('record', '456');
                // $a->save();
                //
                // var_dump($a);
            }

            function test2()
            {
                global $module;
                $a = new AsemloTest($module, 2583);
                // $a->setValue('bar','foo2');

                // $a->setValue('ui_id', 0);
                // $a->renameObject("dead");
                var_dump($a->getValue('nothing'));
                // $a->setValue('bar',0);
                // $a->setValue('record','');
                // $a->save();
                var_dump($a);

            }

            function test3()
            {
                global $module;
                $a = AsemloTest::queryIds($module);
                var_dump("Count", $a, $module->getQueryLogsSql("select log_id where record= ?"));

                $b = AsemloTest::queryObjects($module);
                var_dump(count($b));
                foreach ($b as $B) {
                    echo $B->getId() . " - ";
                }
            }

            function test4()
            {
                global $module;
                $a = AsemloTest::purgeChangeLogs($module,0);
                var_dump($a);

            }
            // test1();
            // test2();
            // test3();
            // test4();



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

        // $('#delete_actions').bind('click', function() {
        //     let result = window.confirm("Are you sure you want to delete ALL actions?");
        //     if (result) module.deleteActions();
        //     // Refresh table
        //     module.getActions();
        // });
        //
        // module.getActions();
        //
        //
        // $('#save_action').bind('click', function() {
        //     let payload = $('#payload').val();
        //     let result = module.addAction(payload);
        //
        //     // refresh table
        //     if (result) module.getActions();
        // });


    });
</script>
