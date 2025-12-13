let escolas = [];

fetch("escolas.kml")
  .then(res => res.text())
  .then(kmlText => {
    const parser = new DOMParser();
    const xml = parser.parseFromString(kmlText, "text/xml");
    const placemarks = xml.getElementsByTagName("Placemark");

    for (let p of placemarks) {
      const nameTag = p.getElementsByTagName("name")[0];
      const coordTag = p.getElementsByTagName("coordinates")[0];

      if (!nameTag || !coordTag) continue;

      const nome = nameTag.textContent.trim();

      const coords = coordTag.textContent.trim().split(",");
      const lon = parseFloat(coords[0]);
      const lat = parseFloat(coords[1]);

      escolas.push({
        nome,
        lat,
        lon
      });
    }

    document.dispatchEvent(new Event("escolasCarregadas"));
  });
