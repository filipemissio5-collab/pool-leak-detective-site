/* ===================================================================
   POOL LEAK DETECTIVE CORP — Scripts
=================================================================== */

document.addEventListener('DOMContentLoaded',function(){

  /* ---- NAV: shadow on scroll ---- */
  var nav=document.getElementById('nav');
  if(nav){
    window.addEventListener('scroll',function(){
      nav.classList.toggle('scrolled',window.scrollY>20);
    });
  }

  /* ---- NAV: mobile toggle ---- */
  var toggle=document.getElementById('navToggle');
  var links=document.getElementById('navLinks');
  if(toggle&&links){
    toggle.addEventListener('click',function(){
      links.classList.toggle('open');
    });
    links.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click',function(){links.classList.remove('open');});
    });
  }

  /* ---- Scroll reveal ---- */
  var io=new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting)e.target.classList.add('show');
    });
  },{threshold:0.15});
  document.querySelectorAll('.reveal').forEach(function(el){io.observe(el);});

  /* ---- Stat counter ---- */
  var statsBox=document.getElementById('stats');
  if(statsBox){
    var counted=false;
    new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting&&!counted){
          counted=true;
          document.querySelectorAll('.stat').forEach(function(s,i){
            setTimeout(function(){s.classList.add('show');},i*100);
          });
          document.querySelectorAll('.stat-num').forEach(function(num){
            var target=+num.dataset.target;
            var prefix=num.dataset.prefix||'';
            var suffix=num.dataset.suffix||'';
            var decimal=num.dataset.decimal==='true';
            var cur=0,step=target/50;
            function tick(){
              cur+=step;if(cur>=target)cur=target;
              var val=decimal?(cur/10).toFixed(1):Math.round(cur);
              num.textContent=prefix+val+suffix;
              if(cur<target)requestAnimationFrame(tick);
            }
            tick();
          });
        }
      });
    },{threshold:0.4}).observe(statsBox);
  }

  /* ---- Sonar canvas (hero) ---- */
  var sonar=document.getElementById('sonar');
  if(sonar){
    var sx=sonar.getContext('2d');
    var SW,SH,st=0,mx=0.5,my=0.4;
    function sresize(){SW=sonar.width=sonar.offsetWidth;SH=sonar.height=sonar.offsetHeight;}
    sresize();window.addEventListener('resize',sresize);
    window.addEventListener('mousemove',function(e){
      mx=e.clientX/window.innerWidth;my=e.clientY/window.innerHeight;
    });
    function drawSonar(){
      sx.clearRect(0,0,SW,SH);
      var cx=SW*mx,cy=SH*(0.2+my*0.3);
      for(var i=0;i<6;i++){
        var r=((st*0.7+i*55)%340);
        var op=0.28*(1-r/340);
        sx.beginPath();
        sx.setLineDash([2,7]);
        sx.arc(cx,cy,r,0,Math.PI*2);
        sx.strokeStyle='rgba(59,125,196,'+op+')';
        sx.lineWidth=1.5;
        sx.stroke();
      }
      st+=0.6;
      requestAnimationFrame(drawSonar);
    }
    drawSonar();
  }

  /* ---- Water canvas (hero) ---- */
  var canvas=document.getElementById('waterCanvas');
  if(canvas){
    var ctx=canvas.getContext('2d');
    var W,H,mouseX=0.5;
    function resize(){W=canvas.width=canvas.offsetWidth;H=canvas.height=canvas.offsetHeight;}
    resize();window.addEventListener('resize',resize);
    window.addEventListener('mousemove',function(e){mouseX=e.clientX/window.innerWidth;});
    var waves=[
      {amp:16,len:0.012,speed:0.018,off:0,color:'rgba(31,58,110,0.07)'},
      {amp:20,len:0.009,speed:0.013,off:2,color:'rgba(59,125,196,0.10)'},
      {amp:13,len:0.016,speed:0.022,off:4,color:'rgba(91,155,216,0.12)'}
    ];
    var t=0;
    function draw(){
      ctx.clearRect(0,0,W,H);
      waves.forEach(function(w){
        ctx.beginPath();ctx.moveTo(0,H);
        for(var x=0;x<=W;x+=6){
          var y=H*0.5+Math.sin(x*w.len+t*w.speed+w.off)*w.amp
            +Math.sin(x*w.len*0.5+t*w.speed*1.4+mouseX*3)*w.amp*0.5;
          ctx.lineTo(x,y);
        }
        ctx.lineTo(W,H);ctx.closePath();ctx.fillStyle=w.color;ctx.fill();
      });
      t+=1;requestAnimationFrame(draw);
    }
    draw();
  }

  /* ---- Smooth scroll for in-page anchors ---- */
  document.querySelectorAll('a[href^="#"]').forEach(function(a){
    a.addEventListener('click',function(e){
      var id=a.getAttribute('href');
      if(id.length>1){
        var target=document.querySelector(id);
        if(target){e.preventDefault();target.scrollIntoView({behavior:'smooth'});}
      }
    });
  });

  /* ---- Contact form (placeholder submit) ---- */
  var form=document.getElementById('quoteForm');
  if(form){
    form.addEventListener('submit',function(e){
      e.preventDefault();
      form.style.display='none';
      var ok=document.getElementById('formSuccess');
      if(ok)ok.style.display='block';
    });
  }

});

/* ===================================================================
   CONVERSION COMPONENTS — quiz + forms
=================================================================== */
(function(){
  /* ---- Quiz logic ---- */
  var quizStep=1;
  window.quizNext=function(){
    var current=document.querySelector('.quiz-step[data-step="'+quizStep+'"]');
    if(current)current.classList.remove('active');
    quizStep++;
    var next=document.querySelector('.quiz-step[data-step="'+quizStep+'"]');
    if(next)next.classList.add('active');
    var bar=document.getElementById('quizBar');
    if(bar)bar.style.width=(quizStep*25)+'%';
  };

  /* ---- Lead forms: hero, quiz, contact ----
     Sends lead data to the Carlos webhook (Make.com). */
  var WEBHOOK_URL = "https://hook.us2.make.com/eh3rvtd7s69thps94v8l7l3cg4njmncq";

  function handleLeadForm(formId,successId,formType){
    var form=document.getElementById(formId);
    if(!form)return;
    form.addEventListener('submit',function(e){
      e.preventDefault();

      /* Collect all fields from the form */
      var data={ source:"website", form_type:formType };
      var inputs=form.querySelectorAll('input,textarea,select');
      inputs.forEach(function(field){
        if(field.name){ data[field.name]=field.value; }
      });

      /* Show success immediately (don't make the user wait) */
      form.style.display='none';
      var ok=document.getElementById(successId);
      if(ok)ok.style.display='block';

      /* Send the lead to the webhook in the background */
      fetch(WEBHOOK_URL,{
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body:JSON.stringify(data)
      }).catch(function(err){
        console.log("Lead send error:",err);
      });
    });
  }
  handleLeadForm('heroForm','heroSuccess','hero');
  handleLeadForm('quizForm','quizSuccess','quiz');
  handleLeadForm('quoteForm','formSuccess','contact');
})();
