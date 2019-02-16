<?php

if($_POST["data_key"] == "cgames"){
    $hobbies = ["MaxPayne" => "MaxPayne", "Silent Assassin" => "Silent Assassin"]; 
    echo json_encode($hobbies); 
}

if($_POST["data_key"] == "mingames"){
    $hobbies = ["ProEvolution" => "ProEvolution", "Motor Racer" => "Motor Racer"]; 
    echo json_encode($hobbies); 
}