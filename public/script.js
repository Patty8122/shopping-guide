// Function to handle dynamic URL input display
document.getElementById('urlInput').addEventListener('change', function() {
  const otherUrlDiv = document.getElementById('otherUrlInput');
  if (this.value === 'Other') {
    otherUrlDiv.style.display = 'block';
  } else {
    otherUrlDiv.style.display = 'none';
  }
});

document.getElementById('scrapeForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const urlSelect = document.getElementById('urlInput');
    let url;
  
    if (urlSelect.value === 'Other') {
      url = document.getElementById('otherUrl').value.trim();
      if (!url) {
        alert("Please enter a valid custom URL.");
        return;
      }
    } else {
      url = urlSelect.value;
    }
     
    document.getElementById('productList').innerHTML='Loading...';
   
    try{
      const res=await fetch('/api/scrape',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({url})
      });
   
      if(!res.ok) throw new Error(await res.text());
   
      const data=await res.json();
      displayProducts(data.products);
    }catch(err){
      document.getElementById('productList').innerHTML=`Error:${err.message}`;
    }
   });
   
   function displayProducts(products){
    document.getElementById('productList').innerHTML=products.map(p=>`
      <div class="card" data-product="${p}">
        <strong>${p}</strong><br>
        <button class="rename-btn">Generate Guide</button>
        <div class="rename-result"></div>
      </div>`).join('');
   
    document.querySelectorAll('.rename-btn').forEach(btn=>{
      btn.addEventListener('click', renameProduct);
    });
   }
   
   async function renameProduct(e){
    const card=e.target.closest('.card');
    const product=card.dataset.product;
    const resultDiv=card.querySelector('.rename-result');
    const selectedModel=document.getElementById('modelSelect').value;
    const systemPrompt=document.getElementById('systemPrompt').value;
   
    resultDiv.innerHTML='Renaming...';
   
    try{
        if (!product || !selectedModel){
        throw new Error("Product or model not selected");
        }

        if (!systemPrompt || systemPrompt.trim() === '') {
            throw new Error("System prompt is required");
        }
      const res=await fetch('/api/rename',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({product, model:selectedModel, system_prompt:systemPrompt})
      });
   
      if(!res.ok) throw new Error(await res.text());
   
      const data=await res.json();
   
      if(data && data.renamed && data.renamed.name){
        // the response does not have an expected structure
        resultDiv.innerHTML="";
        resultDiv.innerHTML+=`<strong>Renamed:</strong> ${data.renamed.name}<br>`;
        for(let key in data.renamed){
          if(key!=='name'){
            resultDiv.innerHTML+=`<strong>${key.charAt(0).toUpperCase()+key.slice(1)}:</strong> ${data.renamed[key]}<br>`;
          }
        }
        
      } else{
        throw new Error("Invalid response structure");
      }
    }catch(err){
      resultDiv.innerHTML=`Error:${err.message}`;
    }
   }
   
   // Event delegation for dynamically added buttons
   document.addEventListener('click', function(e){
    if(e.target.matches('.rename-btn')){
      renameProduct(e);
    }
   });
   