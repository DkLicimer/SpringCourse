from django.shortcuts import render

def index(request):
    return render(request, 'shop/index.html')

def login_view(request):
    return render(request, 'shop/login.html')

def register(request):
    return render(request, 'shop/register.html')

def contact(request):
    return render(request, 'shop/contact.html')

def men_clothing(request):
    return render(request, 'shop/menclothing.html')

def women_clothing(request):
    return render(request, 'shop/womenclothing.html')

def single(request):
    return render(request, 'shop/single.html')

def checkout(request):
    return render(request, 'shop/checkout.html')
