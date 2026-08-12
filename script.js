const form=document.getElementById("bookingForm");
const statusEl=document.getElementById("formStatus");
const dateInput=document.getElementById("date");
const serviceSelect=document.getElementById("serviceSelect");

// Keep this endpoint unchanged because it is the working JasperPC Job Order email system.
const BOOKING_ENDPOINT="https://script.google.com/macros/s/AKfycbyyJrElR0XyvQZbGirpx37hSYxOtrlQpO-JU_f1ipqCpdI9npObHbsYS-Kd2-_NhUyb/exec";

const now=new Date();
now.setMinutes(now.getMinutes()-now.getTimezoneOffset());
dateInput.min=now.toISOString().split("T")[0];

function selectService(service){
  serviceSelect.value=service;
  serviceSelect.dispatchEvent(new Event("change"));
}

function focusService(service){
  const cards=[...document.querySelectorAll(".service-card")];
  const card=cards.find(c=>c.dataset.service===service);
  if(!card) return;

  // Scroll directly to the selected service card. This is especially important
  // on mobile, where jumping to the generic #services section feels like the
  // user was sent to the top instead of the service they tapped.
  cards.forEach(c=>c.classList.remove("service-highlight"));
  card.classList.add("service-highlight");
  card.scrollIntoView({behavior:"smooth",block:"center"});

  // Keep the URL clean instead of leaving #services/#service-... in the address bar.
  if(history.replaceState){ history.replaceState(null,"",location.pathname+location.search); }
  setTimeout(()=>card.classList.remove("service-highlight"),2400);
}

document.querySelectorAll(".quick-link").forEach(el=>el.addEventListener("keydown",e=>{
  if(e.key==="Enter"||e.key===" "){e.preventDefault();el.click();}
}));

document.querySelectorAll(".service-card").forEach(card=>{
  card.setAttribute("role","button");
  card.setAttribute("tabindex","0");
  card.addEventListener("click",e=>{
    if(e.target.closest("a")) return;
    const service=card.dataset.service;
    if(service){
      selectService(service);
      document.getElementById("booking").scrollIntoView({behavior:"smooth",block:"start"});
    }
  });
  card.addEventListener("keydown",e=>{
    if((e.key==="Enter"||e.key===" ")&&!e.target.closest("a")){
      e.preventDefault();card.click();
    }
  });
});

function searchServices(){
  const q=document.getElementById("serviceSearch").value.toLowerCase().trim();
  const cards=[...document.querySelectorAll(".service-card")];
  let shown=0;
  cards.forEach(card=>{
    const match=!q||card.dataset.search.includes(q)||card.innerText.toLowerCase().includes(q);
    card.style.display=match?"block":"none";
    if(match) shown++;
  });
  document.getElementById("noResults").style.display=shown?"none":"block";
  document.getElementById("services").scrollIntoView({behavior:"smooth"});
}

document.getElementById("serviceSearch").addEventListener("keydown",e=>{
  if(e.key==="Enter") searchServices();
});

form.addEventListener("submit",async e=>{
  e.preventDefault();
  const button=form.querySelector("button");
  const data=Object.fromEntries(new FormData(form).entries());
  // Customer email is optional. An empty email is submitted as an empty string.
  button.disabled=true;
  button.textContent="SUBMITTING...";
  statusEl.textContent="Sending job order request...";
  statusEl.style.color="#0757a8";

  try{
    const r=await fetch(BOOKING_ENDPOINT,{
      method:"POST",
      mode:"cors",
      headers:{"Content-Type":"text/plain;charset=utf-8"},
      body:JSON.stringify(data)
    });
    const result=await r.json();
    if(!result.success) throw new Error(result.message||"Job order failed");
    statusEl.textContent="Job order request sent successfully. JasperPC will review your requested schedule and reply to your email to confirm or reschedule.";
    statusEl.style.color="#15803d";
    form.reset();
    dateInput.min=now.toISOString().split("T")[0];
    window.scrollTo({top:document.getElementById("booking").offsetTop-70,behavior:"smooth"});
  }catch(err){
    console.error(err);
    statusEl.textContent="We couldn't submit the booking. Please contact JasperPC directly.";
    statusEl.style.color="#b91c1c";
  }finally{
    button.disabled=false;
    button.textContent="SUBMIT JOB ORDER REQUEST";
  }
});
