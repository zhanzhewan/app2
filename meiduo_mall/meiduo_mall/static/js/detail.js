var vm = new Vue({
    el: '#app',
    // 修改Vue变量的读取语法，避免和django模板语法冲突
    delimiters: ['[[', ']]'],
    data: {
        host,
		hots: [],
		sku_id: sku_id,
        sku_count: 1,
        sku_price: price,
        sku_amount: 0,
        category_id: category_id,
        tab_content: {
		    detail: true,
            pack: false,
            comment: false,
            service: false
        },
        comments: [],
        score_classes: {
            1: 'stars_one',
            2: 'stars_two',
            3: 'stars_three',
            4: 'stars_four',
            5: 'stars_five',
        },
        cart_total_count: 0, // 购物车总数量
        carts: [], // 购物车数据,
    },
    mounted(){
		// 获取热销商品数据
        this.get_hot_goods();

        // 保存用户浏览记录
		this.save_browse_histories();

        // 记录商品详情的访问量
		this.detail_visit();

		// 获取购物车数据
        this.get_carts();

		// 获取商品评价信息
        this.get_goods_comment();
    },
    watch: {
        // 监听商品数量的变化
        sku_count: {
            handler(newValue){
                this.sku_amount = (newValue * this.sku_price).toFixed(2);
            },
            immediate: true
        }
    },
    methods: {
        // 加数量
        on_addition(){
            if (this.sku_count < 5) {
                this.sku_count++;
            } else {
                this.sku_count = 5;
                alert('超过商品数量上限');
            }
            // this.sku_amount = (this.sku_count * this.sku_price).toFixed(2);
        },
        // 减数量
        on_minus(){
            if (this.sku_count > 1) {
                this.sku_count--;
            }
            // this.sku_amount = (this.sku_count * this.sku_price).toFixed(2);
        },
        // 编辑商品数量
        check_sku_count(){
            if (this.sku_count > 5) {
                this.sku_count = 5;
            }
            if (this.sku_count < 1) {
                this.sku_count = 1;
            }
            // this.sku_amount = (this.sku_count * this.sku_price).toFixed(2);
        },
        // 控制页面标签页展示
        on_tab_content(name){
            this.tab_content = {
                detail: false,
                pack: false,
                comment: false,
                service: false
            };
            this.tab_content[name] = true;
        },
    	// 获取热销商品数据
        get_hot_goods(){
        	var url = this.hots + '/hot/'+ this.category_id +'/';
            axios.get(url, {
                    responseType: 'json'
                })
                .then(response => {
                    this.hots = response.data.hot_sku_list;
                    for(var i=0; i<this.hots.length; i++){
                        this.hots[i].url = '/goods/' + this.hots[i].id + '.html';
                    }
                })
                .catch(error => {
                    console.log(error.response);
                })
        },
		// 保存用户浏览记录
		save_browse_histories(){
        	if (this.sku_id) {
        		var url = this.hots + '/browse_histories/';
				axios.post(url, {
						'sku_id':this.sku_id
					}, {
						headers: {
							'X-CSRFToken':getCookie('csrftoken')
						},
						responseType: 'json'
					})
					.then(response => {
						console.log(response.data);
					})
					.catch(error => {
						console.log(error.response);
					});
			}
		},
		// 记录商品详情的访问量
		detail_visit(){
        	if (this.category_id) {
        		var url = this.hots + '/detail/visit/' + this.category_id + '/';
				axios.post(url, {}, {
						headers: {
							'X-CSRFToken':getCookie('csrftoken')
						},
						responseType: 'json'
					})
					.then(response => {
						console.log(response.data);
					})
					.catch(error => {
						console.log(error.response);
					});
			}
		},
        // 加入购物车
        add_cart(){
            var url = this.host + '/carts/';
            axios.post(url, {
                    sku_id: parseInt(this.sku_id),
                    count: this.sku_count
                }, {
                    headers: {
                        'X-CSRFToken':getCookie('csrftoken')
                    },
                    responseType: 'json',
                    withCredentials: true
                })
                .then(response => {
                    if (response.data.code == '0') {
                        alert('添加购物车成功');
                        this.cart_total_count += this.sku_count;
                    } else { // 参数错误
                        alert(response.data.errmsg);
                    }
                })
                .catch(error => {
                    console.log(error.response);
                })
        },
        // 获取购物车数据
        get_carts(){
        	var url = this.host + '/carts/simple/';
            axios.get(url, {
                    responseType: 'json',
                })
                .then(response => {
                    this.carts = response.data.cart_skus;
                    this.cart_total_count = 0;
                    for(var i=0;i<this.carts.length;i++){
                        if (this.carts[i].name.length>25){
                            this.carts[i].name = this.carts[i].name.substring(0, 25) + '...';
                        }
                        this.cart_total_count += this.carts[i].count;
                    }
                })
                .catch(error => {
                    console.log(error.response);
                })
        },
        // 获取商品评价信息
        get_goods_comment(){
            if (this.sku_id) {
                var url = this.hots + '/comment/'+ this.sku_id +'/';
                axios.get(url, {
                        responseType: 'json'
                    })
                    .then(response => {
                        this.comments = response.data.goods_comment_list;
                        for(var i=0; i<this.comments.length; i++){
                            this.comments[i].score_class = this.score_classes[this.comments[i].score];
                        }
                    })
                    .catch(error => {
                        console.log(error.response);
                    });
            }
        },
    }
});










// $(function(){
// 	var price = parseFloat( $('.show_pirze em').html() );
//
// 	// 增加商品数量
// 	$('.num_add').delegate('a','click',function(){
// 		var sHandler = $(this).prop('class');
// 		if (sHandler=='add fr') {
// 			var nowVal = $(this).prev().val();
// 			if (isNaN(nowVal)) {
// 				$(this).prev().val(1);
// 				fnComputTotal(1);
// 			} else {
// 				if (parseInt(nowVal)<1) {
// 					$(this).prev().val(1);
// 					fnComputTotal(1);
// 				} else {
// 					// 判断是否达到最大值
// 					if (parseInt(nowVal)+1 >= 5) {
// 						// 加号按钮设置为灰色
// 						$(this).css({'color':'#cacaca'});
// 						$(this).prev().val(5);
//
// 						// TODO 展示数量上限提示
// 						$(this).trigger('mouseover');
// 					} else {
// 						$(this).prev().val( parseInt(nowVal)+1 );
// 						$(this).next().prop({'style':''});
// 						fnComputTotal(parseInt(nowVal)+1);
// 					}
// 				}
// 			}
// 		}
//
// 		// 减少商品数量
// 		if (sHandler=='minus fr') {
// 			var nowVal = $(this).prev().prev().val();
// 			// 判断商品数量是否为数字
// 			if (isNaN(nowVal)) {
// 				$(this).prev().prev().val(1);
// 				$(this).css({'color':'#cacaca'});
// 				fnComputTotal(1);
// 			} else {
// 				if (parseInt(nowVal)<=1) {
// 					$(this).prev().prev().val(1);
// 					$(this).css({'color':'#cacaca'});
// 					fnComputTotal(1);
// 				} else {
// 					$(this).prev().prev().val( parseInt(nowVal)-1 );
// 					if((parseInt(nowVal)-1)<=1) {
// 						// 减号按钮设置为灰色
// 						$(this).css({'color':'#cacaca'});
// 					} else {
// 						$(this).prop({'style':''});
// 					}
// 					fnComputTotal(parseInt(nowVal)-1);
//
// 					// 恢复加号初始状态
// 					if (parseInt(nowVal)-1 < 5) {
// 						$(this).prev().prop({'style':''});
// 					}
// 				}
// 			}
// 		}
// 	});
//
// 	// 手动编辑商品数量
// 	$('.num_add').delegate('input','keyup',function(){
// 		var nowVal = $(this).val();
// 		// 判断商品数量是否为数字
// 		if (isNaN(nowVal)) {
// 			$(this).val(1);
// 			$(this).next().next().css({'color':'#cacaca'});
// 			fnComputTotal(1);
// 		} else {
// 			// 商品数量大于1
// 			if (nowVal>1) {
// 				// 判断是否达到最大值
// 				if (parseInt(nowVal) >= 5 ) {
// 					// 加号按钮设置为灰色
// 					$(this).next().css({'color':'#cacaca'});
// 					$(this).val(5);
// 				} else {
// 					$(this).next().prop({'style':''});
// 					fnComputTotal(nowVal);
// 				}
// 				$(this).next().next().prop({'style':''});
// 			} else {
// 				// 商品数量小于或等于1
// 				$(this).val(1);
// 				$(this).next().prop({'style':''});
// 				$(this).next().next().css({'color':'#cacaca'});
// 				fnComputTotal(1);
// 			}
// 		}
// 	});
//
// 	// 更新总价
// 	function fnComputTotal(num){
// 		var oTotal = $('.total em');
// 		var sum = num*price;
// 		oTotal.html(sum.toFixed(2)+'元')
// 	}
//
// 	$('.num_add .add').mouseover(function(){
// 		var $tip = $('.overtip');
// 		var $add = $('.num_add .add');
// 		var pos = $add.offset();
// 		$tip.css({'left':pos.left+40,'top':pos.top-1});
// 		console.log(pos.left+40, pos.top-1);
// 		var nowVal = $('.num_show').val();
// 		if(parseInt(nowVal)>=5){
// 			$tip.show();
// 		}
// 	});
//
// 	$('.num_add .add').mouseout(function(){
// 		$('.overtip').hide();
// 	});
//
// 	// 商品规格选择
// 	$('.type_select').delegate('a','click',function(){
// 		$(this).toggleClass('select');
// 	});
//
// 	// 选项卡
// 	var $tab_btn = $('.detail_tab li');
// 	var $tab_con = $('.tab_content');
// 	$tab_btn.click(function(){
// 		$(this).addClass('active').siblings().removeClass('active');
// 		$tab_con.eq( $(this).index() ).addClass('current').siblings().removeClass('current');
// 	});
//
// 	// 页面右上角购物车交互
// 	$('.guest_cart').hover(function(){
// 		if($(this).find('.cart_goods_show').children().length==0){
// 			$(this).find('.goods_count').css({'border-bottom':'0px'});
// 			$(this).find('.cart_name').css({'border-bottom':'1px solid #ddd'});
// 		}else{
// 			$(this).find('.cart_name').css({'border-bottom':'1px solid #fff'});
// 			$(this).find('.goods_count').css({'border-bottom':'1px solid #fff'});
// 		}
// 	},function(){
// 		$(this).find('.goods_count').css({'border-bottom':'0px'});
// 		$(this).find('.cart_name').css({'border-bottom':'1px solid #ddd'});
// 	});
//
// 	// TODO : 获取页面右上角购物车数据
// 	get_cart();
//
// 	// TODO : 获取热销商品
// 	var category_id = $('.breadcrumb').attr('category_id');
// 	get_hot_sku(category_id);
//
// 	// TODO : 获取商品评价信息
// 	var sku_id = $('.goods_detail_con').attr('sku_id');
// 	get_goods_comment(sku_id);
//
// 	// TODO : 保存用户浏览记录
// 	save_browse_histories();
//
// 	// TODO : 记录商品详情的访问量
//     detail_visit();
// });
//
// // 添加购物车
// function add_cart(){
//
// 	var url = '/carts/';
// 	var params = {
// 		'sku_id':parseInt($('.add_cart').attr('sku_id')),
// 		'count':$('.num_show').val()
// 	};
//
// 	$.ajax({
// 	    url: url,
// 	    type: 'post',
// 	    data: JSON.stringify(params),
// 	    contentType: 'application/json',
// 	    headers: {'X-CSRFToken':getCookie('csrftoken')},
// 	    success:function (response) {
// 	    	console.log(response);
// 	        if (response.code == '0') {
// 	            var $circle = $('<span style="width:30px;height:30px;background:#f00;position:absolute;left:0px;top:0px;border-radius:15px;z-index:9999;color:#fff;text-align: center;line-height: 30px;font-size: 20px;"></span>');
// 				$('body').append($circle);
//
// 				var sku_cart_num = $('.num_show').val();
// 				var pos1 = $('.add_cart').offset();
// 				var pos2 = $('#show_count').offset();
// 				var nowcount = $('#show_count').html();
//
// 				$circle.css({'left':pos1.left+75,'top':pos1.top+5});
// 				$circle.html(sku_cart_num);
// 				$circle.animate({'left':pos2.left+5,'top':pos2.top+2},function(){
// 					$('#show_count').html( parseInt(nowcount) + parseInt(sku_cart_num) );
// 					$(this).remove();
// 				});
//
// 				// 动画结束后，补充右上角购物车商品
// 				var goods_detail_pic = $('.goods_detail_pic img').attr('src');
// 				var good_name = $('.goods_detail_list h3').html();
//
// 				var $li = $('<li>' +
//                     '<img src="'+ goods_detail_pic +'" alt="商品图片">' +
//                     '<h4>'+ good_name +'</h4>' +
//                     '<div>'+ sku_cart_num +'</div>' +
//                     '</li>');
// 				$('.cart_goods_show').prepend($li);
// 	        } else {
// 	            alert(response.errmsg);
// 	        }
// 	    }
// 	});
// }
//
// // 获取商品评价信息
// function get_goods_comment(sku_id) {
// 	var url = '/comment/'+ sku_id +'/';
// 	$.get(url, function (response) {
// 		if (response.code == '0') {
// 			var goods_comment_list = response.goods_comment_list;
// 			for (var i = 0; i < goods_comment_list.length; i++) {
// 				var goods_comment = goods_comment_list[i];
//
// 				var comment_text = goods_comment.comment;
//                 var is_anonymous = goods_comment.is_anonymous;
//                 var score = goods_comment.score;
//                 var username;
//                 if (is_anonymous) {
//                 	username = goods_comment.username;
// 				} else {
//                 	username = '匿名';
// 				}
//
//                 var $li = '<li class="judge_list fl">\n' +
//                     '	<div class="user_info fl">\n' +
//                     '   	<img src="/static/images/cat.jpg">\n' +
//                     '   	<b>'+ username +'</b>\n' +
//                     '	</div>\n' +
//                     '	<div class="judge_info fl">\n' +
//                     '   	<div class="stars_'+ score +'"></div>\n' +
//                     '   	<div class="judge_detail">'+ comment_text +'</div>\n' +
//                     '	</div>\n' +
//                     '</li>';
//
// 				$('.judge_list_con').append($li);
//             }
// 		} else {
// 			console.log(response)
// 		}
//     });
// }
//
// // 保存用户浏览记录
// function save_browse_histories() {
// 	var sku_id = $('.goods_detail_con').attr('sku_id');
// 	if (!sku_id) {
// 		return;
// 	}
// 	var params = {
// 		'sku_id':sku_id
// 	};
// 	$.ajax({
// 	    url: '/browse_histories/',
// 	    type: 'post',
// 	    data: JSON.stringify(params),
// 	    contentType: 'application/json',
// 	    headers: {'X-CSRFToken':getCookie('csrftoken')},
// 	    success:function (response) {
// 	        if (response.code == '0') {
// 				console.log(response);
// 	        } else {
// 	            console.log(response);
// 	        }
// 	    }
// 	});
// }
//
// // 记录商品详情的访问量
// function detail_visit() {
// 	var category_id = $('.breadcrumb').attr('category_id');
// 	if (!category_id) {
// 		return;
// 	}
//
// 	$.ajax({
// 	    url: '/detail/visit/' + category_id + '/',
// 	    type: 'post',
// 	    contentType: 'application/json',
// 	    headers: {'X-CSRFToken':getCookie('csrftoken')},
// 	    success:function (response) {
// 	        if (response.code == '0') {
// 				console.log(response);
// 	        } else {
// 	            console.log(response);
// 	        }
// 	    }
// 	});
// }
