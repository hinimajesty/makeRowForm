<?php
    if($_POST["data_key"] == "hobbies"){
        $hobbies = ["Football" => "Football", "Ludo" => "Ludo"]; 
        echo json_encode($hobbies); 
    }
?>