 //-- Navigation bar tab switching --
 export function setupNavTabs(){
    function showPage(pageId){
        //turn off all nav highlights (reomve underline/bold from every navbar link)
        document.querySelectorAll(".navlink").forEach(l=>l.classList.remove("active"));
        //removes .active from every section so CSS hides them all
        document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
        
        //find matching navbar link and highlight it if exist
        const nav = document.querySelector(`.navlink[data-page="${pageId}"]`);
        if(nav) nav.classList.add("active");

        //finds the correct selection and adds .active making it visible
        document.getElementById(pageId).classList.add("active");
    }

    //navbar clicks
    document.querySelectorAll(".navlink[data-page]").forEach(link => {
        link.addEventListener("click", (e) => {
          e.preventDefault();
          showPage(link.dataset.page);
        });
      });

    //home page buttons (data-go)
    document.querySelectorAll("[data-go]").forEach(btn=>{
        btn.addEventListener("click",e=>{
            e.preventDefault();
            showPage(btn.dataset.go);
        });
    });
 }
     

    