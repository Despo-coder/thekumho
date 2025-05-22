import React from 'react'

const takeout = () => {
    return (
        <div>
            <div className="layout-content-container container mx-auto  flex flex-col max-w-[960px] flex-1">
                <h2 className="text-[#181111] text-center text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">Order Takeout</h2>
                <div className="flex overflow-y-auto [-ms-scrollbar-style:none] [scrollbar-width:none] [&amp;::-webkit-scrollbar]:hidden">
                    <div className="flex items-stretch p-4 gap-6">
                        <div className="flex h-full flex-1 flex-col gap-4 rounded-lg min-w-40">
                            <div
                                className="w-full bg-center bg-no-repeat aspect-square bg-cover rounded-xl flex flex-col"
                                style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBJn_TUuvJQVYPZaLyK3FY-cwMs4k-eZQH-z7NhoNy8XOfuj3wBV4-PV2jbA4gZ0-u3BBrT0YVu5VQA3gMJndsmyS7faAG7KBEzFgeSwaBQOB7yeVkQ2fuM7DyXU_9RW7uOBMcQxkTUT32UXzRATq5xs3PNSXuR5J6JlB8IKAH0w46X-VmTPZBw0jMvhp5Qw5pZ-JUsoMlC9Y3xHMQ49nWdj_10DqLOy7qsnhij9T3RIHGOlTaUOerSVlc9b0kPJ0MO5nvTWchiv-c")' }}
                            ></div>
                            <div>
                                <p className="text-[#181111] text-base font-medium leading-normal">Sushi Set</p>
                                <p className="text-[#886364] text-sm font-normal leading-normal">Assorted sushi pieces with fresh fish and rice.</p>
                            </div>
                        </div>
                        <div className="flex h-full flex-1 flex-col gap-4 rounded-lg min-w-40">
                            <div
                                className="w-full bg-center bg-no-repeat aspect-square bg-cover rounded-xl flex flex-col"
                                style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuB_jG6bCg-pbY2UVs6P89dDIoIHEzsit4u95VAI-MOhc4mc5AuLrpoSbFOj1JTKzGvUmrRa03tCpNt9xZtkGtTOpo8pyKRN2CjCfPpgcalG0ckFHfNwhUHZ5DcEhC6GEBIq8OtnAsjxdSdJ9ay8FvnH-J3sd6AL7jtsTYZ8iIn331vJb1opxssnrvndAw-ZUY0nk_Ixbxar23o9bqYWR6FfEGDW3U-wW7ahlOgfx_lRNaCWIjbK77RNiN5Usz2g44XiQlxfSgBNCGM")' }}
                            ></div>
                            <div>
                                <p className="text-[#181111] text-base font-medium leading-normal">Ramen Bowl</p>
                                <p className="text-[#886364] text-sm font-normal leading-normal">Hearty ramen with rich broth and toppings.</p>
                            </div>
                        </div>
                        <div className="flex h-full flex-1 flex-col gap-4 rounded-lg min-w-40">
                            <div
                                className="w-full bg-center bg-no-repeat aspect-square bg-cover rounded-xl flex flex-col"
                                style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuA43VspxwYRIW5DXwMUoxyatLZvWO7PTZGVhiKadz4Xb1SbOI3Q-x2j98-hcDV-7JhDAxSmVaHYgHkJmNhWdEnDjImAN-YlMY5DxWS0e1fBcRT81_KBWiUFKA0UCJpxRKqAxBISyyzANRoiprzMb2j0cBLcORJHFCkL8wYIGacUcOH_rqlV3-W-9jCYAkaWbjmZwobIy2WlltZkc5cOSWXwC5k9FGVUpie_G8T5qc_8afefFVJC-xWXKnA3c3WKq9EjJENoakSpgy0")' }}
                            ></div>
                            <div>
                                <p className="text-[#181111] text-base font-medium leading-normal">Tempura Platter</p>
                                <p className="text-[#886364] text-sm font-normal leading-normal">Crispy tempura with dipping sauce.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default takeout
