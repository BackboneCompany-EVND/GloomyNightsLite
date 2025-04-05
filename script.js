// Esperamos a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function () {
  // Seleccionamos los divs con las clases correspondientes
  const div1 = document.querySelector('.box.box1');
  const div2 = document.querySelector('.box.box2');
  const div3 = document.querySelector('.box.box3');
  const divRegresar = document.querySelector('.box.boxRegresar'); // Seleccionamos el div boxRegresar
  const boxRegresarCreditos = document.querySelector('.box.boxRegresarCreditos'); // Seleccionamos el div boxRegresarCreditos

  // Verificamos si los divs existen antes de añadir los event listeners
  if (div1) {
    div1.addEventListener('click', function () {
      // Redirigimos a 'div1.html' al hacer clic en 'box box1'
      window.location.href = 'game.html';
    });
  }

  if (div2) {
    div2.addEventListener('click', function () {
      // Redirigimos a 'div2.html' al hacer clic en 'box box2'
      window.location.href = 'controles.html';
    });
  }

  if (div3) {
    div3.addEventListener('click', function () {
      // Redirigimos a 'div3.html' al hacer clic en 'box box3'
      window.location.href = 'creditos.html';
    });
  }

  if (divRegresar) {
    divRegresar.addEventListener('click', function () {
      // Redirigimos al 'index.html' al hacer clic en el div con la clase 'box boxRegresar'
      window.location.href = 'index.html';
    });
  }

  if (boxRegresarCreditos) {
    boxRegresarCreditos.addEventListener('click', function () {
      // Redirigimos al 'index.html' al hacer clic en el div con la clase 'box boxRegresarCreditos'
      window.location.href = 'index.html';
    });
  }
});


