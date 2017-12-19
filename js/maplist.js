function MapImgOptions(Mapletter, times) {
  for (var x = 1; x <= times; x++) {
    var option = document.createElement('option');
    option.value = Mapletter + x;
    option.innerHTML = Mapletter + x;
    document.getElementById('mapchoice').appendChild(option);
    }
      }

MapImgOptions('C', 20); 
MapImgOptions('N', 8); 
MapImgOptions('S', 9);