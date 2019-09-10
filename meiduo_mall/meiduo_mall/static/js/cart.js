var vm = new Vue({
    el: '#app',
    // 修改Vue变量的读取语法，避免和django模板语法冲突
    delimiters: ['[[', ']]'],
    data: {
        host,
        carts: [],
        total_count: 0,
        total_selected_count: 0,
        total_selected_amount: 0,
        carts_tmp: [],
    },
    computed: {
        selected_all(){
            var selected=true;
            for(var i=0; i<this.carts.length; i++){
                if(this.carts[i].selected==false){
                    selected=false;
                    break;
                }
            }
            return selected;
        },
    },
    mounted(){
        // 初始化购物车数据并渲染界面
        this.render_carts();

        // 计算商品总数量：无论是否勾选
        this.compute_total_count();

        // 计算被勾选的商品总金额和总数量
        this.compute_total_selected_amount_count();
    },
    methods: {
        // 初始化购物车数据并渲染界面
        render_carts(){
            // 渲染界面
            this.carts = JSON.parse(JSON.stringify(cart_skus));
            for(var i=0; i<this.carts.length; i++){
                if(this.carts[i].selected=='True'){
                    this.carts[i].selected=true;
                } else {
                    this.carts[i].selected=false;
                }
            }
            // 手动记录购物车的初始值，用于更新购物车失败时还原商品数量
            this.carts_tmp = JSON.parse(JSON.stringify(cart_skus));
        },
        // 计算商品总数量：无论是否勾选
        compute_total_count(){
            var total_count = 0;
            for(var i=0; i<this.carts.length; i++){
                total_count += parseInt(this.carts[i].count);
            }
            this.total_count = total_count;
        },
        // 计算被勾选的商品数量和总金额
        compute_total_selected_amount_count(){
            var amount = 0;
            var total_count = 0;
            for(var i=0; i<this.carts.length; i++){
                if(this.carts[i].selected) {
                    amount += parseFloat(this.carts[i].price) * parseInt(this.carts[i].count);
                    total_count += parseInt(this.carts[i].count);
                }
            }
            this.total_selected_amount = amount.toFixed(2); // for循环中不要使用toFixed的累加
            this.total_selected_count = total_count;
        },
        // 减少操作
        on_minus(index){
            if (this.carts[index].count > 1) {
                var count = this.carts[index].count - 1;
                // this.carts[index].count = count; // 本地测试
                this.update_count(index, count); // 请求服务器
            }
        },
        // 增加操作
        on_add(index){
            var count = 1;
            if (this.carts[index].count < 5) {
                count = this.carts[index].count + 1;
            } else {
                count = 5;
                alert('超过商品数量上限');
            }
            // this.carts[index].count = count; // 本地测试
            this.update_count(index, count); // 请求服务器
        },
        // 数量输入框输入操作
        on_input(index){
            var count = parseInt(this.carts[index].count);
            if (isNaN(count) || count <= 0) {
                count = 1;
            } else if (count > 5) {
                count = 5;
                alert('超过商品数量上限');
            }
            this.update_count(index, count); // 请求服务器
        },
        // 更新购物车
        update_count(index, count){
            var url = this.host + '/carts/';
            axios.put(url, {
                    sku_id: this.carts[index].id,
                    count:count,
                    selected: this.carts[index].selected
                }, {
                    headers:{
                        'X-CSRFToken':getCookie('csrftoken')
                    },
                    responseType: 'json',
                    withCredentials: true
                })
                .then(response => {
                    if (response.data.code == '0') {
                        // this.carts[index].count = response.data.cart_sku.count; // 无法触发页面更新
                        Vue.set(this.carts, index, response.data.cart_sku); // 触发页面更新
                        // 重新计算界面的价格和数量
                        this.compute_total_selected_amount_count();
                        this.compute_total_count();

                        // 更新成功将新的购物车再次临时保存
                        this.carts_tmp = this.carts;
                    } else {
                        alert(response.data.errmsg);
                        this.carts[index].count = this.carts_tmp[index].count;
                    }
                })
                .catch(error => {
                    console.log(error.response);
                    this.carts[index].count = this.carts_tmp[index].count;
                })
        },
        // 更新购物车选中数据
        update_selected(index) {
            var url = this.host + '/carts/';
            axios.put(url, {
                    sku_id: this.carts[index].id,
                    count: this.carts[index].count,
                    selected: this.carts[index].selected
                }, {
                    headers: {
                        'X-CSRFToken':getCookie('csrftoken')
                    },
                    responseType: 'json',
                    withCredentials: true
                })
                .then(response => {
                    if (response.data.code == '0') {
                        this.carts[index].selected = response.data.cart_sku.selected;
                        // 重新计算界面的价格和数量
                        this.compute_total_selected_amount_count();
                        this.compute_total_count();
                    } else {
                        alert(response.data.errmsg);
                    }
                })
                .catch(error => {
                    console.log(error.response);
                })
        },
        // 删除购物车数据
        on_delete(index){
            var url = this.host + '/carts/';
            axios.delete(url, {
                    data: {
                        sku_id: this.carts[index].id
                    },
                    headers:{
                        'X-CSRFToken':getCookie('csrftoken')
                    },
                    responseType: 'json',
                    withCredentials: true
                })
                .then(response => {
                    if (response.data.code == '0') {
                        this.carts.splice(index, 1);
                        // 重新计算界面的价格和数量
                        this.compute_total_selected_amount_count();
                        this.compute_total_count();
                    } else {
                        alert(response.data.errmsg);
                    }
                })
                .catch(error => {
                    console.log(error.response);
                })
        },
        // 购物车全选
        on_selected_all(){
            var selected = !this.selected_all;
            axios.put(this.host + '/carts/selection/', {
                    selected
                }, {
                    headers:{
                        'X-CSRFToken':getCookie('csrftoken')
                    },
                    responseType: 'json',
                    withCredentials: true
                })
                .then(response => {
                    if (response.data.code == '0') {
                        for (var i=0; i<this.carts.length;i++){
                            this.carts[i].selected = selected;
                        }
                        // 重新计算界面的价格和数量
                        this.compute_total_selected_amount_count();
                        this.compute_total_count();
                    } else {
                        alert(response.data.errmsg);
                    }
                })
                .catch(error => {
                    console.log(error.response);
                })
        },
    }
});










// var last_count;
//
// $(function(){
// 	// 计算页面数据：商品总件数+结算总价+结算总件数+商品勾选
// 	fnTotalSum();
//
// 	// 初始值为商品数量上限或者下限的处理(1或者5)
// 	var $num_show = $('.num_show');
// 	$num_show.each(function(){
// 		if(parseInt($(this).val())==1){
// 			$(this).next().css({'color':'#cacaca'});
// 		}
// 		if(parseInt($(this).val())==5){
// 			$(this).prev().css({'color':'#cacaca'});
// 		}
// 	});
//
// 	// 商品加
// 	$('.cart_list_td').delegate('a,input','click',function(){
// 		var sHandler = $(this).prop('class');
// 		var fFprice = parseFloat($(this).parent().parent().prev().html());
// 		if(sHandler=='add fl'){
// 			var nowVal = $(this).next().val();
// 			last_count = nowVal;
// 			if(isNaN(nowVal))
// 			{
// 				$(this).next().val(1);
// 				// fnSubSum($(this).parent().parent().next(),fFprice,1);
// 				// fnTotalSum();
// 			}
// 			else{
// 				if(parseInt(nowVal)<1){
// 					$(this).next().val(1);
// 					$(this).css({'color':'#cacaca'});
// 					// fnSubSum($(this).parent().parent().next(),fFprice,1);
// 					// fnTotalSum();
// 				}else{
// 					$(this).next().val( parseInt(nowVal)+1 );
// 					if( (parseInt(nowVal)+1)>=5 ){
// 						alert('最大商品数为5');
// 						$(this).next().val(5);
// 						$(this).css({'color':'#cacaca'});
// 						// fnSubSum($(this).parent().parent().next(),fFprice,5);
// 						// fnTotalSum();
// 					}
// 					else{
// 						// fnSubSum($(this).parent().parent().next(),fFprice,parseInt(nowVal)+1);
// 						// fnTotalSum();
// 					}
// 					$(this).next().next().prop({'style':''});
// 				}
// 			}
//
// 			// 发送增加购物车请求
// 			var sku_id = $(this).next().attr('sku_id');
// 			var count = $(this).next().val();
// 			var selected = $(this).parent().parent().siblings('.col01').children().prop('checked');
// 			var input_dom = $(this).next();
// 			update_cart(sku_id, count, selected, input_dom)
// 		}
//
// 		// 商品减
// 		if(sHandler=='minus fl'){
// 			var nowVal = $(this).prev().val();
// 			last_count = nowVal;
// 			if(isNaN(nowVal))
// 			{
// 				$(this).prev().val(1);
// 				$(this).css({'color':'#cacaca'});
// 				// fnSubSum($(this).parent().parent().next(),fFprice,1);
// 				// fnTotalSum();
// 			}
// 			else{
// 				if(parseInt(nowVal)<=1){
// 					$(this).prev().val(1);
// 					$(this).css({'color':'#cacaca'});
// 					// fnSubSum($(this).parent().parent().next(),fFprice,1);
// 					// fnTotalSum();
// 				}else{
// 					$(this).prev().val( parseInt(nowVal)-1 );
// 					if((parseInt(nowVal)-1)<=1)
// 					{
// 						$(this).prev().val(1);
// 						$(this).css({'color':'#cacaca'});
// 						// fnSubSum($(this).parent().parent().next(),fFprice,1);
// 						// fnTotalSum();
// 					}
// 					else{
// 						$(this).prop({'style':''});
// 						// fnSubSum($(this).parent().parent().next(),fFprice,parseInt(nowVal)-1);
// 						// fnTotalSum();
// 					}
// 					// 恢复加号初始状态
// 					if (parseInt(nowVal)-1 < 5) {
// 						$(this).prev().prev().prop({'style':''});
// 					}
// 				}
// 			}
//
// 			// 发送减少购物车请求
// 			var sku_id = $(this).prev().attr('sku_id');
// 			var count = $(this).prev().val();
// 			var selected = $(this).parent().parent().siblings('.col01').children().prop('checked');
// 			var input_dom = $(this).prev();
// 			update_cart(sku_id, count, selected, input_dom)
// 		}
//
// 		// 删除商品
// 		if($(this).parent().prop('class')=='col08'){
// 			delete_cart($(this))
// 		}
//
// 		// 是否选择商品
// 		if($(this).parent().prop('class')=='col01'){
// 			var oAllCheck = $('.settlements .col01 input');
// 			var oChecks = $('.cart_list_td .col01 input');
// 			if($(this).prop('checked')==false){
// 				oAllCheck.prop({'checked':false});
// 			}else{
// 				oAllCheck.prop({'checked':true});
// 				oChecks.each(function(){
// 					if($(this).prop('checked')==false){
// 						oAllCheck.prop({'checked':false});
// 					}
// 				})
// 			}
// 			// fnTotalSum();
//
// 			// 直接编辑购物车数量请求
// 			var sku_id = $(this).attr('sku_id');
// 			var count = $(this).parent().siblings('.col06').find('.num_show').val();
// 			var selected = $(this).prop('checked');
// 			var input_dom = $(this);
// 			update_cart(sku_id, count, selected, input_dom)
// 		}
// 	});
//
// 	// 商品数量直接输入
// 	$('.num_add').delegate('input','keyup',function(){
// 		var nowVal = $(this).val();
// 		last_count = nowVal;
// 		var fFprice = parseFloat($(this).parent().parent().prev().html());
// 		if(isNaN(nowVal)){
// 			$(this).val(1);
// 			$(this).next().css({'color':'#cacaca'});
// 			// fnSubSum($(this).parent().parent().next(),fFprice,1);
// 			// fnTotalSum();
// 		}else{
// 			if(nowVal>1){
// 				if(nowVal>=5){
// 					alert('最大商品数为5');
// 					$(this).val(5);
// 					$(this).prev().css({'color':'#cacaca'});
// 					// fnSubSum($(this).parent().parent().next(),fFprice,5);
// 					// fnTotalSum();
// 				}else{
// 					$(this).prev().prop({'style':''});
// 					// fnSubSum($(this).parent().parent().next(),fFprice,nowVal);
// 					// fnTotalSum();
// 				}
// 				$(this).next().prop({'style':''});
// 			}
// 			else{
// 				$(this).val(1);
// 				$(this).prev().prop({'style':''});
// 				$(this).next().css({'color':'#cacaca'});
// 				// fnSubSum($(this).parent().parent().next(),fFprice,1);
// 				// fnTotalSum();
// 			}
// 		}
//
// 		// 直接编辑购物车数量请求
// 		var sku_id = $(this).attr('sku_id');
// 		var count = $(this).val();
// 		var selected = $(this).parent().parent().siblings('.col01').children().prop('checked');
// 		var input_dom = $(this);
// 		update_cart(sku_id, count, selected, input_dom)
// 	});
//
//
// 	// 全选按钮
// 	$('.settlements .col01 input').click(function(){
// 		select_all($(this));
// 	});
//
// });
//
// // 计算页面局部数据：
// function fnSubSum(obj,price,num){
// 	var fSubSum = price*num;
// 	obj.html( fSubSum.toFixed(2) + '元' );
// }
//
//
// // 计算页面数据：商品总件数+结算总价+结算总件数+商品勾选+小计
// function fnTotalSum(){
// 	var oAllGoods = $('.cart_list_td');
// 	var iTotalNum = 0;
// 	var iTotalBuyNum = 0;
// 	var fTotalPrice = 0;
//
// 	oAllGoods.each(function(){
// 		var oCheck = $(this).find('.col01 input');
// 		iTotalNum += parseInt( $(this).find('.num_show').val());
//
// 		if(oCheck.prop('checked')){
// 			iTotalBuyNum += parseInt( $(this).find('.num_show').val());
// 			fTotalPrice += parseFloat( $(this).find('.col07').html());
// 		}else{
// 			$('.settlements .col01 input').prop({'checked':false});
// 		}
// 	});
//
// 	$('.total_count em').html(iTotalNum);
// 	$('.settlements .col03 b').html(iTotalBuyNum);
// 	$('.settlements .col03 em').html(fTotalPrice.toFixed(2));
//  }
//
// // 更新购物车：添加 编辑 减少 勾选
// function update_cart(sku_id, count, selected, input_dom) {
// 	// input_dom : 当前正在交互的标签
// 	var url = '/carts/';
// 	var params = {
// 		'sku_id':sku_id,
// 		'count':count,
// 		'selected':selected
// 	};
//
// 	$.ajax({
// 	    url: url,
// 	    type: 'put',
// 	    data: JSON.stringify(params),
// 	    contentType: 'application/json',
// 	    headers: {'X-CSRFToken':getCookie('csrftoken')},
// 	    success:function (response) {
// 	    	console.log(response);
// 	        if (response.code == '0') {
// 	            // 服务器更新数据成功，使用JS更新dom
// 				if (input_dom.prop('type') == 'checkbox') {
// 					// 勾选
// 					input_dom.prop({'checked':selected})
// 				} else {
// 					// 添加 编辑 减少
// 					input_dom.val(count);
// 					fnSubSum(input_dom.parent().parent().next(), parseFloat(input_dom.parent().parent().prev().html()),count);
// 				}
// 				fnTotalSum();
// 	        } else {
// 	            alert(response.errmsg);
// 	            if (input_dom.prop('type') == 'checkbox') {
// 					input_dom.prop({'checked':!selected})
// 				} else {
// 					input_dom.val(last_count);
// 					fnSubSum(input_dom.parent().parent().next(), parseFloat(input_dom.parent().parent().prev().html()),last_count);
// 				}
// 				fnTotalSum();
// 	        }
// 	    }
// 	});
// }
//
// // 删除购物车
// function delete_cart(delete_dom) {
// 	// input_dom : 当前正在交互的标签
// 	var url = '/carts/';
// 	var sku_id = delete_dom.attr('sku_id');
// 	var params = {
// 		'sku_id':sku_id
// 	};
//
// 	$.ajax({
// 	    url: url,
// 	    type: 'delete',
// 	    data: JSON.stringify(params),
// 	    contentType: 'application/json',
// 	    headers: {'X-CSRFToken':getCookie('csrftoken')},
// 	    success:function (response) {
// 	    	console.log(response);
// 	        if (response.code == '0') {
// 	        	delete_dom.parent().parent().remove();
// 	        	fnTotalSum();
// 	        } else {
// 	            alert(response.errmsg);
// 	        }
// 	    }
// 	});
// }
//
// // 购物车全选
// function select_all(select_all_dom) {
// 	var url = '/carts/selection/';
// 	var selected = select_all_dom.prop('checked');
// 	var params = {
// 		'selected':selected
// 	};
//
// 	$.ajax({
// 	    url: url,
// 	    type: 'put',
// 	    data: JSON.stringify(params),
// 	    contentType: 'application/json',
// 	    headers: {'X-CSRFToken':getCookie('csrftoken')},
// 	    success:function (response) {
// 	    	console.log(response);
// 	        if (response.code == '0') {
// 	        	var oChecks = $('.cart_list_td .col01 input');
// 				if(selected==false){
// 					oChecks.each(function(){
// 						$(this).prop({'checked':false})
// 					})
// 				}else{
// 					oChecks.each(function(){
// 						$(this).prop({'checked':true})
// 					})
// 				}
// 				fnTotalSum();
// 	        } else {
// 	            alert(response.errmsg);
// 	        }
// 	    }
// 	});
// }