// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
  // 平滑滚动
  document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      var target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });

  // 图片加载失败时隐藏
  document.querySelectorAll('.demo-img').forEach(function(img) {
    img.addEventListener('error', function() {
      this.parentElement.style.display = 'none';
    });
  });

  // 分享按钮
  var shareBtn = document.getElementById('shareBtn');
  if (shareBtn) {
    shareBtn.addEventListener('click', openShareModal);
  }

  // 分享弹窗背景点击关闭
  var shareModal = document.getElementById('shareModal');
  if (shareModal) {
    shareModal.addEventListener('click', function(event) {
      if (event.target.id === 'shareModal') {
        closeShareModal();
      }
    });
  }

  // 阻止弹窗内容点击冒泡
  var modalContent = document.querySelector('.share-modal-content');
  if (modalContent) {
    modalContent.addEventListener('click', function(event) {
      event.stopPropagation();
    });
  }

  // 分享选项按钮
  var shareWeChat = document.getElementById('shareWeChat');
  if (shareWeChat) {
    shareWeChat.addEventListener('click', shareToWeChat);
  }

  var shareQQ = document.getElementById('shareQQ');
  if (shareQQ) {
    shareQQ.addEventListener('click', shareToQQ);
  }

  var shareWeibo = document.getElementById('shareWeibo');
  if (shareWeibo) {
    shareWeibo.addEventListener('click', shareToWeibo);
  }

  var shareCopy = document.getElementById('shareCopy');
  if (shareCopy) {
    shareCopy.addEventListener('click', copyLink);
  }

  // 复制链接按钮
  var copyUrlBtn = document.getElementById('copyUrlBtn');
  if (copyUrlBtn) {
    copyUrlBtn.addEventListener('click', copyLink);
  }

  // 关闭分享弹窗按钮
  var shareCloseBtn = document.getElementById('shareCloseBtn');
  if (shareCloseBtn) {
    shareCloseBtn.addEventListener('click', closeShareModal);
  }

  // 微信提示关闭按钮
  var wechatTipCloseBtn = document.getElementById('wechatTipCloseBtn');
  if (wechatTipCloseBtn) {
    wechatTipCloseBtn.addEventListener('click', closeWechatTip);
  }
});

// 检测是否在微信浏览器中
function isWeChat() {
  return /MicroMessenger/i.test(navigator.userAgent);
}

// 打开分享弹窗
function openShareModal() {
  if (isWeChat()) {
    // 在微信中，显示引导用户使用右上角分享
    document.getElementById('wechatShareTip').classList.add('active');
  } else {
    document.getElementById('shareModal').classList.add('active');
  }
}

// 关闭分享弹窗
function closeShareModal() {
  document.getElementById('shareModal').classList.remove('active');
}

// 关闭微信提示
function closeWechatTip() {
  document.getElementById('wechatShareTip').classList.remove('active');
}

// 分享到微信（非微信浏览器时跳转到二维码）
function shareToWeChat() {
  if (isWeChat()) {
    closeShareModal();
    document.getElementById('wechatShareTip').classList.add('active');
  } else {
    // 非微信浏览器，提示用户复制链接
    alert('请复制链接后在微信中打开分享');
    copyLink();
  }
}

// 分享到QQ
function shareToQQ() {
  var url = encodeURIComponent('https://storyglint.com');
  var title = encodeURIComponent('NovaScribe - 智能网文创作工具');
  var summary = encodeURIComponent('专业的网文创作工具，支持AI辅助创作、云端同步、章节管理。让创作更高效！');
  var pic = encodeURIComponent('https://storyglint.com/share-icon.png');

  window.open('https://connect.qq.com/widget/shareqq/index.html?url=' + url + '&title=' + title + '&summary=' + summary + '&pics=' + pic, '_blank');
}

// 分享到微博
function shareToWeibo() {
  var url = encodeURIComponent('https://storyglint.com');
  var title = encodeURIComponent('NovaScribe - 智能网文创作工具 - 专业的网文创作工具，支持AI辅助创作、云端同步、章节管理');
  var pic = encodeURIComponent('https://storyglint.com/share-icon.png');

  window.open('https://service.weibo.com/share/share.php?url=' + url + '&title=' + title + '&pic=' + pic, '_blank');
}

// 复制链接
function copyLink() {
  var input = document.getElementById('shareUrl');
  input.select();
  input.setSelectionRange(0, 99999);

  try {
    document.execCommand('copy');
    alert('链接已复制到剪贴板');
  } catch (err) {
    // 使用现代 API
    navigator.clipboard.writeText(input.value).then(function() {
      alert('链接已复制到剪贴板');
    }).catch(function() {
      alert('复制失败，请手动复制');
    });
  }
}
