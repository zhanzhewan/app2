var vm = new Vue({
    el: '#app',
	// 修改Vue变量的读取语法，避免和django模板语法冲突
    delimiters: ['[[', ']]'],
    data: {
        host: host,
        order_submitting: false, // 正在提交订单标志
        pay_method: 2, // 支付方式,默认支付宝支付
        nowsite: '', // 默认地址
        payment_amount: '',
    },
    mounted(){
        // 初始化
        this.payment_amount = payment_amount;
        // 绑定默认地址
        this.nowsite = default_address_id;
    },
    methods: {
        // 提交订单
        on_order_submit(){
            if (!this.nowsite) {
                alert('请补充收货地址');
                return;
            }
            if (!this.pay_method) {
                alert('请选择付款方式');
                return;
            }
            if (this.order_submitting == false){
                this.order_submitting = true;
                var url = this.host + '/orders/commit/';
                axios.post(url, {
                        address_id: this.nowsite,
                        pay_method: this.pay_method
                    }, {
                        headers:{
                            'X-CSRFToken':getCookie('csrftoken')
                        },
                        responseType: 'json'
                    })
                    .then(response => {
                        if (response.data.code == '0') {
                            location.href = '/orders/success/?order_id='+response.data.order_id
                                        +'&payment_amount='+this.payment_amount
                                        +'&pay_method='+this.pay_method;
                        } else if (response.data.code == '4101') {
                            location.href = '/login/?next=/orders/settlement/';
                        } else {
                            alert(response.data.errmsg);
                        }
                    })
                    .catch(error => {
                        this.order_submitting = false;
                        console.log(error.response);
                    })
            }
        }
    }
});









// $(function () {
//
// });
//
//
// // 提交订单
// $('#order_btn').click(function () {
//     var url = '/orders/commit/';
//
//     var address_id = $('input[name="address_id"]:checked').val();
//     var paymethod = $('input[name="pay_method"]:checked').val();
//     if (address_id == "") {
//         alert("请先选择收货地址!");
//         return;
//     }
//     if (paymethod == "") {
//         alert("请先选择支付方式!");
//         return;
//     }
//
//     var params = {
//         'address_id':address_id,
//         'pay_method':parseInt(paymethod)
//     };
//
//     $.ajax({
//         url: url,
//         type: 'post',
//         data: JSON.stringify(params),
//         contentType: 'application/json',
//         headers: {'X-CSRFToken':getCookie('csrftoken')},
//         success:function (response) {
//             if (response.code == '0') {
//                 var pay_method = $('input[name="pay_method"]:checked').val();
//                 var payment_amount = $('.total_pay b').html();
//                 location.href = '/orders/success/?order_id='+response.order_id
//                             +'&payment_amount='+payment_amount
//                             +'&pay_method='+pay_method;
//             } else if (response.code == '4101') {
//                 location.href = '/login/?next=/orders/settlement/';
//             } else {
//                 alert(response.errmsg);
//             }
//         }
//     });
// });