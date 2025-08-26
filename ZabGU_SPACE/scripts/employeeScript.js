 const applicationSummaries = document.querySelectorAll('.item-summary');

// Перебираем каждый заголовок и вешаем на него обработчик клика
applicationSummaries.forEach(summary => {
    summary.addEventListener('click', () => {
        // Находим родительский элемент всей заявки (.application-item)
        const item = summary.closest('.application-item');
        
        // Переключаем класс 'expanded' у родителя.
        // CSS сам позаботится об анимации и отображении деталей.
        item.classList.toggle('expanded');
    });
});