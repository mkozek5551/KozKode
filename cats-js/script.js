const catButton = document.querySelector("#cat-button");
const dogButton = document.querySelector("#dog-button");
const imageContainer = document.querySelector("#image-container");

catButton.addEventListener("click", function() {
  fetch("https://cataas.com/cat")
    .then(response => {
      return response.blob();
    })
    .then(imageBlob => {
      const imageUrl = URL.createObjectURL(imageBlob);
      imageContainer.innerHTML = `<img src="${imageUrl}" class="image">`;
    });
});

dogButton.addEventListener("click", function() {
  fetch("https://dog.ceo/api/breeds/image/random")
    .then(response => response.json())
    .then(data => {
      const imgUrl = data.message;
      imageContainer.innerHTML = `<img src="${imgUrl}" class="image">`;
    })
    .catch(error => console.error(error));
});
