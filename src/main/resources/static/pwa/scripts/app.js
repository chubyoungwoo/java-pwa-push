
'use strict'

const publicVapidKey = "BNzzfdcBcThU27FcGve6F3GF6He2Fro82ZMuOLga9fukatLMlaKB6GdO-82loi6W4iGdPQZAp_4HLgST8z5of_E";
const subscribe = document.querySelector('#subscribe');    //알림허용
const unsubscribe = document.querySelector('#unsubscribe');  //알림해제
const subscriptionDetail = document.querySelector('#subscription_detail');  //비고

let notify = document.querySelector('#notify');      // 메세지
let msgSend1 = document.querySelector('#msgSend1');    //1. 메세지 전송버튼
let msgSend2 = document.querySelector('#msgSend2');    //2. 메세지 전송버튼

let isSubscribed = false;    //구독상태 체크
let swRegistration = null;

// 베이스 64로 인코딩
function urlB64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// 알림기능 지원하는 브라우저인지 체크
if ('serviceWorker' in navigator && 'PushManager' in window) {
  console.log('서비스 워커 사용가능 브라우저 입니다.');

  navigator.serviceWorker.register('serviceworker.js')
  .then(function(swReg) {
    swRegistration = swReg;
     initialiseUI();
  })
  .catch(function(error) {
    console.debug('서비스 워커 등록 에러', error);
  });
} else {
  console.warn('푸시 메세지를 사용할수 없는 브라우저 입니다.');
  subscriptionDetail.textContent = '푸시기능없음';
}

// 초기화 처리
function initialiseUI() {
 // console.log('swRegistration : ',swRegistration);
  //알림허용 클릭 리스너 등록
   subscribe.addEventListener('click', function() {
    subscribe.disabled = true;
    if (!isSubscribed) {  //구독중이 아니면
      subscribeUser();  //구독등록
    }
  });
  
  //알림해제 클릭 리스너 등록
   unsubscribe.addEventListener('click', function() {
    unsubscribe.disabled = true;
    if (isSubscribed) {  //구독중이면
      // TODO: 구독취소 
      unsubscribeUser();
    } 
  });
  
   //메세지 전송 버튼1
    msgSend1.addEventListener('click', function() {
	    msgSend1.disabled = true;
	    if (isSubscribed) {  //구독중이면
	      sendMessageServer(1);
	    } 
    });

//메세지 전송 버튼1
  msgSend2.addEventListener('click', function() {
	  msgSend2.disabled = true;
	  if (isSubscribed) {  //구독중이면
	    sendMessageServer(2);
	  } 
  });
    
  // Set the initial subscription value
  swRegistration.pushManager.getSubscription()
  .then(function(subscription) {

    console.log('초기화 구독값', subscription )
    isSubscribed = !(subscription === null);

    if (isSubscribed) {
      console.log('사용자 구독');
    } else {
      console.log('사용자 미구독');
    }

    updateBtn();
  });
}

// 버튼 상태 처리
function updateBtn() {

  console.log("permissrr",Notification.permission)
   //알림 차단인경우
  if (Notification.permission === 'denied') {
    subscriptionDetail.textContent = '알림이 차단되었습니다. 구독을 원하시면 알림을 허용 해 주세요';
    subscribe.disabled = false;
    unsubscribe.disabled = true;
    return;
  }

  if (isSubscribed) {
    subscribe.disabled= true;
    unsubscribe.disabled = false;
    msgSend1.disabled = false;
    msgSend2.disabled = false;
  } else {    
    subscribe.disabled= false;
    unsubscribe.disabled = true;
    msgSend1.disabled = true;
    msgSend2.disabled = true;
  }
}

//알림등록(구독)
function subscribeUser() {
  const applicationServerKey = urlB64ToUint8Array(publicVapidKey);
  swRegistration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: applicationServerKey
  })
  .then(function(subscription) {
    console.log('사용자알림등록:', subscription);

    updateSubscriptionOnServer(subscription);
    isSubscribed = true;

    updateBtn();
  })
  .catch(function(err) {
    console.log('실패 subscribe the user: ', err);
    updateBtn();
  });
}

//서버전송용 사용자브라우저 정보를 db에 저장한다.
async function updateSubscriptionOnServer(subscription) {
  // TODO: Send subscription to application server
  console.log('서버전송 subscription',subscription)
  
  const endpoint = subscription.endpoint;
  const p256dh = subscription.keys;
   
  console.log('endpoint==>',endpoint)
  console.log('p256dh',p256dh)
  
  if (subscription) {
      console.log('알림등록 subscription : ', JSON.stringify(subscription))
      await fetch("/push/subscribe.do", {
        method: "POST",
        body: JSON.stringify(subscription),
        headers: {
          "content-type": "application/json"
        }
      });
      console.log("Push Sent...");
      updateBtn();
  } 
}

// 알림해제 정보를 db에 저장한다.
function unsubscribeUser() {
  swRegistration.pushManager.getSubscription()
  .then(async function(subscription) {
    if (subscription) {
	   //구독취소 정보 db처리
	   console.log('알림해제 subscription : ', JSON.stringify(subscription))
       await fetch("/push/unsubscribe.do", {
        method: "POST",
        body: JSON.stringify(subscription),
        headers: {
          "content-type": "application/json"
        }
      })
      .then(() => subscription.unsubscribe())
      .catch((error) => console.log("error:", error));
      
      //return subscription.unsubscribe();
    }
  })
  .catch(function(error) {
    console.log('구독취소중 에러', error);
  })
  .then(function() {
 
    console.log('구독취소');
    isSubscribed = false;

    updateBtn();
  });
}


//푸쉬알리미 메세지를 전송한다.
async function sendMessageServer(gubun) {
      let params = "";
      
      if(gubun == 1) { 
          params = {
	          title : '제목 : ' + title.value,
	          body: 'Simple piece of body text.\nSecond line of body text 👍 : ' + notify.value,
	          icon: '',  //나타날아이콘
	          image: '', 
	          requireInteraction: false,       
	          badge: '',       //모바일기기에서 상단 status바에 뜰 소형 아이콘
	          vibrate: [200, 100, 200, 100, 200, 100, 400],  //모바일기기에서 진동 
	          params: {},
	          actions: []
	      }
      } else if(gubun == 2) { 
          params = {
	          title : '제목 : ' + title.value,
	          body: '내용 : ' + notify.value,
	          icon: './images/icons/raining_sun_weather_icon_131718.png',  //나타날아이콘
	          image: './images/arch-5678549_640.jpg', 
	          requireInteraction: false,       
	          badge: './images/badge.png',       //모바일기기에서 상단 status바에 뜰 소형 아이콘
	          vibrate: [200, 100, 200, 100, 200, 100, 400],  //모바일기기에서 진동 
	          params: { url: 'http://www.naver.com' },
	          actions: [
			        {
			          action: 'close',
			          title: '닫기',
			          icon: './images/icons/icons8-close100.png'
			        },
			        {
			          action: 'atom-action',
			          title: '네이버',
			          icon: './images/icons/naver.png'
			        }
			     ]
	      }
      } else if(gubun == 3) { 
          params = {
	          title : '제목 : ' + title.value,
	          body: '내용 : ' + notify.value,
	          icon: './images/icons/raining_sun_weather_icon_131718.png',  //나타날아이콘
	          image: './images/arch-5678549_640.jpg', 
	          requireInteraction: false,       
	          badge: './images/badge.png',       //모바일기기에서 상단 status바에 뜰 소형 아이콘
	          vibrate: [200, 100, 200, 100, 200, 100, 400],  //모바일기기에서 진동 
	          params: { url: 'http://www.naver.com' },
	          actions: [
			        {
			          action: 'close',
			          title: '닫기',
			          icon: './images/icons/icons8-close100.png'
			        },
			        {
			          action: 'atom-action',
			          title: '네이버',
			          icon: './images/icons/naver.png'
			        }
			     ]
	      }
      }  else {
	     params = {
	          title : '제목 : ' + title.value,
	          body: '내용 : ' + notify.value,
	          icon: './images/icons/raining_sun_weather_icon_131718.png',  //나타날아이콘
	          image: './images/arch-5678549_640.jpg', 
	          requireInteraction: false,       
	          badge: './images/badge.png',       //모바일기기에서 상단 status바에 뜰 소형 아이콘
	          vibrate: [200, 100, 200, 100, 200, 100, 400],  //모바일기기에서 진동 
	          params: { url: 'http://www.naver.com' },
	          actions: [
			        {
			          action: 'close',
			          title: '닫기',
			          icon: './images/icons/icons8-close100.png'
			        },
			        {
			          action: 'atom-action',
			          title: '네이버',
			          icon: './images/icons/naver.png'
			        }
			     ]
	      }
      }

      await fetch("/push/sendMessage.do", {
        method: "POST",
        body: JSON.stringify(params),
        headers: {
          "content-type": "application/json"
        }
      });
      
      updateBtn();  //버튼상태처리

}

