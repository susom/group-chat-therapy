<?php
/** @var \Stanford\GroupChatTherapy\GroupChatTherapy $module */
    $build_files = $module->generateAssetFiles();
?>

<html lang="en">
<head>

    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vite + React</title>
    <script src="https://code.jquery.com/jquery-3.2.1.slim.min.js" integrity="sha384-KJ3o2DKtIkvYIK3UENzmM7KCkRr/rE9/Qpg6aAZGJwFDMVNA/GpGFF93hXpG5KkN" crossorigin="anonymous"></script>
    <script src="https://code.jquery.com/jquery-3.6.1.slim.min.js" integrity="sha256-w8CvhFs7iHNVUtnSP0YKEg00p9Ih13rlL9zGqvLdePA=" crossorigin="anonymous"></script>

    <?php
        $module->injectJSMO();
        foreach ($build_files as $file)
            echo $file;
    ?>
</head>
<body>
<div id="root"></div>

</body>
</html>

