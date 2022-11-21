<!-- Created by: Krish Patel, Tom Croux, Connor Collington, and Muhammad Al-Lami-->
<!-- The base website is taken from Krish Patel's website: https://krishadmin.com -->
<!DOCTYPE html>
<html lang="en">

  <head>
    <meta name="google-site-verification" content="Ins5oDxeE3Eis7ehSoGjG_NsK9qtZJYJtkwU1JOhkPM" />
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="ie=edge" />
    <title>TMAV Tech Support</title>
    <meta name="description" content="" />

    <link rel="stylesheet" href="./style.css" />

    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.3.1/dist/css/bootstrap.min.css" integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T" crossorigin="anonymous">
    

  </head>
  
  <header class="header">
    <div class="header__content">
      <div class="header__logo-container" >
        <span class="header__logo-sub" style="color: #a9b8ff;"><a href="./">TMAV Tech Support</a></span>
      </div>
      <div class="header__main">
        <ul class="header__links">
          <li class="header__link-wrapper">
            <a href="https://docs.google.com/presentation/d/1k75P96EEo64NrazL4WO0-aUI5l44HBTYb2uGTOjX2zg/edit?usp=share_link" class="header__link">Presentation</a>
          </li>
          <li class="header__link-wrapper">
            <a href="./" class="header__link">Data</a>
          </li>
          <li class="header__link-wrapper">
            <a href="./aboutus.html" class="header__link">About Us</a>
          </li>
        </ul>
      </div>
    </div>
  </header>

  <body class='bo'>   
    <br><br><br><br><br><br><br>  <br>

    <div class="phrase">
      <h1>Population Metrics for the 10 countries with the hightest Growth Rates </h1>
    </div>  
    <div class="chartCard">
      <div class="chartBox">
        <canvas id="myChart"></canvas>
      </div>
    </div>
    </body>

<?php
  $servername = "localhost";
  $username = "root";
  $password = "DisChatDit3$";
  $database = "data";

  // Create connection
  $conn = new mysqli($servername, $username, $password, $database);

  // Check connection
  if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
  } 

  // Get table data from All_Data
  $sql = "SELECT id, name, Growth, Population FROM All_Data";
  $result = $conn->query($sql);
  if ($result->num_rows > 0) {
    // get the 10 first rows
    $rows = array();
    while($row = $result->fetch_assoc()) {
      $rows[] = $row;
    }
    $rows = array_slice($rows, 0, 10);
    // output data of the first 10 rows
    // Create array name, growth
    $name = array();
    $growth = array();
    $pop = array();
    foreach($rows as $row) {
      $name[] = $row['name'];
      $growth[] = $row['Growth'];
      $pop[] = $row['Population'];
    }
    // Set arrays as javascript arrays
    echo "<script>let country = ".json_encode($name).";</script>";
    echo "<script>let gr = ".json_encode($growth).";</script>";
    echo "<script>let pop = ".json_encode($pop).";</script>";
    
  }


?>

<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script src="graphs.js"></script>

<!--Some JavaScript for the graphs was taken from: https://www.chartjs3.com/docs/chart/getting-started/-->
</html>